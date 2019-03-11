<?php

namespace Biigle\Modules\Videos\Jobs;

use File;
use Storage;
use FileCache;
use VipsImage;
use SplFileInfo;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use Biigle\Jobs\Job;
use FFMpeg\Coordinate\TimeCode;
use Biigle\Modules\Videos\Video;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ProcessNewVideo extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * The new video that should be processed.
     *
     * @var Video
     */
    protected $video;

    /**
     * The FFMpeg video instance.
     *
     * @var \FFMpeg\Media\Video
     */
    protected $ffmpegVideo;

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
        FileCache::getOnce($this->video, function ($file, $path) {
            $this->video->duration = $this->getVideoDuration($path);
            $this->video->save();

            $times = $this->getThumbnailTimes($this->video->duration);
            $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
            $fragment = fragment_uuid_path($this->video->uuid);
            $format = config('thumbnails.format');
            $width = config('thumbnails.width');
            $height = config('thumbnails.height');

            foreach ($times as $index => $time) {
                $buffer = $this->generateVideoThumbnail($path, $time, $width, $height, $format);
                $disk->put("{$fragment}/{$index}.{$format}", $buffer);
            }
        });
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
        $thumb = tempnam(config('videos.tmp_dir'), 'video-thumb-');

        try {
            $this->ffmpegVideo->frame(TimeCode::fromSeconds($time))->save($thumb);
            $buffer = VipsImage::thumbnail($thumb, $width, ['height' => $height])
                ->writeToBuffer(".{$format}");
        } finally {
            File::delete($thumb);
        }

        return $buffer;
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
        // Round to 100 ms because FFMpeg does not extract frames that are defined with
        // a time code that equals the duration to the last digit. E.g. for a video with
        // a duration of 149.84 it will only work with the time code 149.8.
        $duration = round($duration, 1);
        $count = config('videos.thumbnail_count');

        if ($count <= 1) {
            return [$duration / 2];
        }

        $step = $duration / floatval($count - 1);
        $range = range(0, $duration, $step);

        // Sometimes there is one entry too few due to rounding errors.
        if (count($range) < $count) {
            $range[] = $duration;
        }

        return $range;
    }
}
