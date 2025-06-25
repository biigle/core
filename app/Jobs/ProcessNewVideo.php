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
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Jcupitt\Vips\Image as VipsImage;
use Log;
use Throwable;

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
     */
    protected $ffmpegVideo;

    /**
     * The FFProbe instance.
     *
     * @var FFProbe|null
     */
    protected $ffprobe;

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

        if ($this->hasInvalidMoovAtomPosition($path)) {
            $this->video->error = Video::ERROR_INVALID_MOOV_POS;
        } elseif ($this->video->error) {
            $this->video->error = null;
        }

        $this->video->save();

        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $fragment = fragment_uuid_path($this->video->uuid);
        try {
            $tmp = config('videos.tmp_dir');
            $tmpDir = "{$tmp}/{$fragment}";

            // Directory for extracted images
            if (!File::exists($tmpDir)) {
                File::makeDirectory($tmpDir, 0755, true);
            }

            // Extract images from video
            $this->extractImagesfromVideo($path, $this->video->duration, $tmpDir);

            // Generate thumbnails
            $this->generateVideoThumbnails($disk, $fragment, $tmpDir);
        } catch (Exception $e) {
            // The video seems to be fine if it passed the previous checks. There may be
            // errors in the actual video data but we can ignore that and skip generating
            // thumbnails. The browser can deal with the video and see if it can be
            // displayed.
            Log::warning("Could not generate thumbnails for new video {$this->video->id}: {$e->getMessage()}");
        } finally {
            if (isset($tmpDir) && File::exists($tmpDir)) {
                File::deleteDirectory($tmpDir);
            }
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
        $maxThumbnails = config('videos.sprites_max_thumbnails');
        $minThumbnails = config('videos.thumbnail_count');
        $defaultThumbnailInterval = config('videos.sprites_thumbnail_interval');
        $durationRounded = floor($duration * 10) / 10;
        if ($durationRounded <= 0) {
            return;
        }

        $estimatedThumbnails = floor($durationRounded / $defaultThumbnailInterval);
        // Adjust the frame time based on the number of estimated thumbnails
        $thumbnailInterval = ($estimatedThumbnails > $maxThumbnails) ? $durationRounded / $maxThumbnails
            : (($estimatedThumbnails < $minThumbnails) ? $durationRounded / $minThumbnails : $defaultThumbnailInterval);
        $frameRate = 1 / $thumbnailInterval;

        $this->generateSnapshots($path, $frameRate, $destinationPath, $estimatedThumbnails);
    }

    public function generateVideoThumbnails($disk, $fragment, $tmpDir)
    {

        // Config for normal thumbs
        $format = config('thumbnails.format');
        $thumbCount = config('videos.thumbnail_count');
        // Double the size for crisp display on high-dpi montors.
        $width = config('thumbnails.width') * 2;
        $height = config('thumbnails.height') * 2;

        // Config for sprite thumbs
        $thumbnailsPerSprite = config('videos.sprites_thumbnails_per_sprite');
        $thumbnailsPerRow = sqrt($thumbnailsPerSprite);
        $spriteFormat = config('videos.sprites_format');

        $files = File::glob($tmpDir . "/*.{$format}");
        $nbrFiles = count($files);
        $steps = $nbrFiles >= $thumbCount ? floor($nbrFiles / $thumbCount) : 1;

        $thumbnails = [];
        $thumbCounter = 0;
        $spriteCounter = 0;
        foreach ($files as $i => $file) {
            if ($i === intval($steps*$thumbCounter) && $thumbCounter < $thumbCount) {
                $thumbnail = $this->generateThumbnail($file, $width, $height);
                $bufferedThumb = $thumbnail->writeToBuffer(".{$format}", [
                    'Q' => 85,
                    'strip' => true,
                ]);
                $disk->put("{$fragment}/{$thumbCounter}.{$format}", $bufferedThumb);
                $thumbCounter += 1;
            }

            if (count($thumbnails) < $thumbnailsPerSprite) {
                $thumbnails[] = $this->generateThumbnail($file, $width, $height);
            }

            if (count($thumbnails) === $thumbnailsPerSprite || $i === ($nbrFiles - 1)) {
                $sprite = VipsImage::arrayjoin($thumbnails, ['across' => $thumbnailsPerRow]);
                $bufferedSprite = $sprite->writeToBuffer(".{$format}", [
                    'Q' => 75,
                    'strip' => true,
                ]);
                $disk->put("{$fragment}/sprite_{$spriteCounter}.{$spriteFormat}", $bufferedSprite);
                $thumbnails = [];
                $spriteCounter += 1;
            }
        }
    }

    /**
     * Run the actual command to extract snapshots from the video. Separated into its own
     * method for easier testing.
     *
     * maxFrames = -1 means no restriction.
     */
    protected function generateSnapshots(string $sourcePath, float $frameRate, string $targetDir, int $maxFrames = -1): void
    {
        $format = config('thumbnails.format');
        // Leading zeros are important to prevent file sorting afterwards
        Process::forever()
            ->run("ffmpeg -i '{$sourcePath}' -vf fps={$frameRate} -frames:v {$maxFrames} {$targetDir}/%04d.{$format}")
            ->throw();
    }

    /**
     * Generate a thumbnail from a video snapshot. Separated into its own method for
     * easier testing.
     */
    protected function generateThumbnail(string $file, int $width, int $height): VipsImage
    {
        return VipsImage::thumbnail($file, $width, ['height' => $height]);
    }

    protected function hasInvalidMoovAtomPosition($sourcePath)
    {
        // Webm and mpeg videos don't have a moov atom
        if (in_array($this->video->mimeType, ['video/mpeg', 'video/webm'])) {
            return false;
        }

        $process = Process::forever()
            ->run("ffprobe -v trace -i '{$sourcePath}'  2>&1 | grep -o -e type:\'mdat\' -e type:\'moov\'")
            ->throw();
        $output = explode("\n", $process->output());
        return !str_contains($output[0], 'moov');
    }
}
