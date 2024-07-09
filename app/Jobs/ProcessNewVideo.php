<?php

namespace Biigle\Jobs;

use App;
use Biigle\Video;
use Exception;
use FFMpeg\Coordinate\Dimension;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Log;
use Symfony\Component\Process\Process;
use Throwable;
use VipsImage;

class ProcessNewVideo extends Job implements ShouldQueue
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 2;

    /**
     * The new video that should be processed.
     *
     * @var Video
     */
    public $video;

    /**
     * The FFMpeg video instance.
     *
     * @var \FFMpeg\Media\Video
     */
    protected $ffmpegVideo;

    /**
     * Ignore this job if the video does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new instance.
     *
     * @param Video $video The video that should be processed.
     */
    public function __construct(Video $video)
    {
        $this->video = $video;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::getOnce($this->video, [$this, 'handleFile']);
        } catch (Exception $e) {
            $retry = true;
            if (!$this->video->error) {
                if (Str::startsWith($e->getMessage(), 'The file is too large')) {
                    $this->video->error = Video::ERROR_TOO_LARGE;
                    $retry = false;
                } elseif (preg_match("/MIME type '.+' not allowed\.$/", $e->getMessage()) === 1) {
                    $this->video->error = Video::ERROR_MIME_TYPE;
                    $retry = false;
                } else {
                    $this->video->error = Video::ERROR_NOT_FOUND;
                }

                $this->video->save();
            }

            if (App::runningUnitTests()) {
                throw $e;
            } elseif ($retry && $this->attempts() < $this->tries) {
                // Retry after 10 minutes.
                $this->release(600);
            } else {
                Log::warning("Could not process new video {$this->video->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Process a cached video file.
     *
     * @param Video $file
     * @param string $path
     */
    public function handleFile($file, $path)
    {
        $this->video->mimeType = File::mimeType($path);
        if (!in_array($this->video->mimeType, Video::MIMES)) {
            $this->video->error = Video::ERROR_MIME_TYPE;
            $this->video->save();
            return;
        }

        $codec = $this->getCodec($path);

        if ($codec === '') {
            $this->video->error = Video::ERROR_MALFORMED;
            $this->video->save();
            return;
        }

        if (!in_array($codec, Video::CODECS)) {
            $this->video->error = Video::ERROR_CODEC;
            $this->video->save();
            return;
        }

        $this->video->size = File::size($path);
        $this->video->duration = $this->getVideoDuration($path);

        try {
            $dimensions = $this->getVideoDimensions($path);
            $this->video->width = $dimensions->getWidth();
            $this->video->height = $dimensions->getHeight();
        } catch (Throwable $e) {
            // ignore and leave dimensions at null.
        }

        if ($this->video->error) {
            $this->video->error = null;
        }
        $this->video->save();

        $format = config('thumbnails.format');
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $fragment = fragment_uuid_path($this->video->uuid);
        $width = config('thumbnails.width');
        $height = config('thumbnails.height');
        try {
            $tmp = config('videos.tmp_dir');
            $tmpDir = "{$tmp}/{$fragment}";
            if (!File::exists($tmpDir)) {
                File::makeDirectory($tmpDir, 0755, true);
            }

            if (!$disk->exists($fragment)) {
                $disk->makeDirectory($fragment);
            }

            // Extract images from video
            $this->extractImagesfromVideo($path, $this->video->duration, $tmpDir);

            // Generate thumbnails
            $files = File::glob($tmpDir."/*.{$format}");
            $this->generateVideoThumbnails($files, $disk->path($fragment.'/'), $width, $height);

            // Generate sprites
            $this->generateSprites($disk, $tmpDir, $fragment);

            $parentDir = dirname($fragment, 2);
            if (File::exists($tmpDir)) {
                File::deleteDirectory($tmp."/{$parentDir}");
            }
        } catch (Exception $e) {
            // The video seems to be fine if it passed the previous checks. There may be
            // errors in the actual video data but we can ignore that and skip generating
            // thumbnails. The browser can deal with the video and see if it can be
            // displayed.
            Log::warning("Could not generate thumbnails for new video {$this->video->id}: {$e->getMessage()}");
        }
    }

    /**
     * Get the codec of a video
     *
     * @param string $url URL/path to the video file
     *
     * @return string
     */
    protected function getCodec($url)
    {
        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        try {
            return $this->ffprobe->streams($url)->videos()->first()->get('codec_name');
        } catch (Throwable $e) {
            return '';
        }
    }

    /**
     * Get the duration of the video.
     *
     * @param string $path Video file path.
     *
     * @return float Duration in seconds.
     */
    protected function getVideoDuration($path)
    {
        return (float) FFProbe::create()
            ->format($path)
            ->get('duration');
    }

    /**
     * Get the dimensions of a video
     *
     * @param string $url URL/path to the video file
     *
     * @return Dimension
     */
    protected function getVideoDimensions($url)
    {
        if (!isset($this->ffprobe)) {
            $this->ffprobe = FFProbe::create();
        }

        return $this->ffprobe->streams($url)->videos()->first()->getDimensions();
    }

    /**
     * Extract images from video.
     *
     * @param string $path Path to the video file.
     * @param float $duration Duration of video in seconds.
     * @param $destinationPath Path to where images will be saved.
     * @throws Exception if images cannot be extracted from video.
     *
     */
    protected function extractImagesfromVideo($path, $duration, $destinationPath)
    {
        $format = config('thumbnails.format');
        $maxThumbnails = config('videos.sprites_max_thumbnails');
        $minThumbnails = config('videos.sprites_min_thumbnails');
        $defaultThumbnailInterval = config('videos.sprites_thumbnail_interval');
        $durationRounded = floor($duration * 10) / 10;
        $estimatedThumbnails = $durationRounded / $defaultThumbnailInterval;
        // Adjust the frame time based on the number of estimated thumbnails
        $thumbnailInterval = ($estimatedThumbnails > $maxThumbnails) ? $durationRounded / $maxThumbnails
            : (($estimatedThumbnails < $minThumbnails) ? $durationRounded / $minThumbnails : $defaultThumbnailInterval);
        $frameRate = 1 / $thumbnailInterval;

        // Leading zeros are important to prevent file sorting afterwards
        $p = Process::fromShellCommandline("ffmpeg -i '{$path}' -vf fps={$frameRate} {$destinationPath}/%04d.{$format}");
        $p->run();
        if ($p->getExitCode() !== 0) {
            throw new Exception("Process was terminated with code {$p->getExitCode()}");
        }

    }

    /**
     * Generate thumbnails from the video images.
     *
     * @param $files Array of image paths.
     * @param $thumbnailsDir Path to directory where thumbnails will be saved.
     * @param $width Width of the thumbnail.
     * @param $height Height of the thumbnail.
     * @throws Exception if image cannot be resized.
     *
     * **/
    protected function generateVideoThumbnails($files, $thumbnailsDir, $width, $height)
    {
        $format = config('thumbnails.format');
        foreach ($files as $f) {
            $filename = pathinfo($f, PATHINFO_FILENAME);
            $p = Process::fromShellCommandline("ffmpeg -i '{$f}' -vf scale={$width}:{$height}:force_original_aspect_ratio=1 {$thumbnailsDir}{$filename}.{$format}");
            $p->run();
            if ($p->getExitCode() !== 0) {
                throw new Exception("Process was terminated with code {$p->getExitCode()}");
            }
        }
    }

    /**
     * Get the times at which thumbnails should be sampled.
     *
     * @param float $duration Video duration.
     *
     * @return array
     */
    protected function getThumbnailTimes($duration)
    {
        $count = config('videos.thumbnail_count');

        if ($count <= 1) {
            return [$duration / 2];
        }

        // Start from 0.5 and stop at $duration - 0.5 because FFMpeg sometimes does not
        // extract frames from a time code that is equal to 0 or $duration.
        $step = ($duration - 1) / floatval($count - 1);
        $start = 0.5;
        $end = $duration - 0.5;
        $range = range($start, $end, $step);

        // Sometimes there is one entry too few due to rounding errors.
        if (count($range) < $count) {
            $range[] = $end;
        }

        return $range;
    }

    /**
     * Generate sprites from a video file and save them to a storage disk.
     *
     * Sprites are created as thumbnails of frames and organized into sprite sheets.
     *
     * @param $disk Storage disk where sprites will be saved.
     * @param $thumbnailDir Directory where thumbnails are saved.
     * @param $fragment Path where sprite frames will be saved.
     * @throws Exception if images cannot be resized and transformed to webp format.
     *
     */
    protected function generateSprites($disk, $thumbnailDir, $fragment)
    {
        $thumbnailsPerSprite = config('videos.sprites_thumbnails_per_sprite');
        $thumbnailsPerRow = sqrt($thumbnailsPerSprite);
        $thumbnailWidth = config('videos.sprites_thumbnail_width');
        $thumbnailHeight = config('videos.sprites_thumbnail_height');
        $spriteFormat = config('videos.sprites_format');
        $thumbFormat = config('thumbnails.format');
        $tmp = config('videos.tmp_dir');
        $aspectRatio = $this->video->width/$this->video->height;
        $paddingX = $aspectRatio >= 1 ? 0 : "(ow-iw)/2";
        $paddingY = $aspectRatio >= 1 ? "(oh-ih)/2" : 0;

        $sprite_images_path = "{$tmp}/sprite-images/{$fragment}";
        if (!File::exists($sprite_images_path)) {
            File::makeDirectory($sprite_images_path, 0755, true);
        }
        $files = File::glob($thumbnailDir . "/*.{$thumbFormat}");
        foreach ($files as $f) {
            $filename = pathinfo($f, PATHINFO_FILENAME);
            $p = Process::fromShellCommandline("ffmpeg -i '{$f}' -vf \"scale={$thumbnailWidth}:{$thumbnailHeight}:force_original_aspect_ratio=1,pad=w={$thumbnailWidth}:h={$thumbnailHeight}:{$paddingX}:{$paddingY}\" {$sprite_images_path}/{$filename}.{$spriteFormat}");
            $p->run();
            if ($p->getExitCode() !== 0) {
                throw new Exception("Process was terminated with code {$p->getExitCode()}");
            }
        }

        $files = File::glob($sprite_images_path . "/*.{$spriteFormat}");
        $thumbnails = Arr::map($files, fn ($f) => VipsImage::newFromFile($f));

        // Split array into sprite-chunks
        $chunks = array_chunk($thumbnails, $thumbnailsPerSprite);
        $spritesCounter = 0;
        foreach ($chunks as $chunk) {
            // Join the thumbnails into a NxN sprite
            $sprite = VipsImage::arrayjoin($chunk, ['across' => $thumbnailsPerRow]);

            // Write the sprite to buffer with quality 75 and stripped metadata
            $spritePath = "{$fragment}/sprite_{$spritesCounter}.{$spriteFormat}";
            $sprite->writeToFile($disk->path("{$spritePath}"), [
                'Q' => 75,
                'strip' => true,
            ]);
            $spritesCounter += 1;
        }
        if (File::exists($sprite_images_path)) {
            File::deleteDirectory("{$tmp}/sprite-images/");
        }

    }
}
