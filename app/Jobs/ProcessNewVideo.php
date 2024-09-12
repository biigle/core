<?php

namespace Biigle\Jobs;

use App;
use Biigle\Video;
use Exception;
use FFMpeg\Coordinate\Dimension;
use FFMpeg\Coordinate\TimeCode;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use File;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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

        if ($this->video->error) {
            $this->video->error = null;
        }
        $this->video->save();

        $times = $this->getThumbnailTimes($this->video->duration);
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $fragment = fragment_uuid_path($this->video->uuid);
        $format = config('thumbnails.format');
        $width = config('thumbnails.width');
        $height = config('thumbnails.height');

        try {
            foreach ($times as $index => $time) {
                $buffer = $this->generateVideoThumbnail($path, $time, $width, $height, $format);
                $disk->put("{$fragment}/{$index}.{$format}", $buffer);
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
     * Generate a thumbnail from the video at the specified time.
     *
     * @param string $path Path to the video file.
     * @param float $time Time for the thumbnail in seconds.
     * @param int $width Width of the thumbnail.
     * @param int $height Height of the thumbnail.
     * @param string $format File format of the thumbnail (e.g. 'jpg').
     *
     * @return string Vips image buffer string.
     */
    protected function generateVideoThumbnail($path, $time, $width, $height, $format)
    {
        // Cache the video instance.
        if (!isset($this->ffmpegVideo)) {
            $this->ffmpegVideo = FFMpeg::create()->open($path);
        }

        $buffer = (string) $this->ffmpegVideo->frame(TimeCode::fromSeconds($time))
            ->save('', false, true);

        return VipsImage::thumbnail_buffer($buffer, $width, ['height' => $height])
            ->writeToBuffer(".{$format}", [
                'Q' => 85,
                'strip' => true,
            ]);
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
}
