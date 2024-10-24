<?php

namespace Biigle\Jobs;

use Biigle\Video;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Storage;

class CloneVideoThumbnails extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * Path of original video thumbnails and sprites
     * @var string
     */
    public $prefix;

    /**
     * Path of cloned video thumbnails and sprites
     * @var string
     */
    public $copyPrefix;

    /**
     * Cloned video of cloned volume
     * @var Video
     */
    public $video;

    public function __construct(Video $video, String $prefix)
    {
        $this->video = $video;
        $this->prefix = $prefix;
        $this->copyPrefix = fragment_uuid_path($video->uuid);
    }

    public function handle()
    {
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));

        if (!$this->hasThumbnails($disk) || !$this->hasSprites($disk)) {
            ProcessNewVideo::dispatch($this->video);
        }

        $files = $disk->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $disk->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }

    private function hasThumbnails($disk)
    {
        $format = config('thumbnails.format');
        return $disk->exists("{$this->prefix}/0.{$format}");
    }

    private function hasSprites($disk)
    {
        $format = config('videos.sprites_format');
        return $disk->exists("{$this->prefix}/sprite_0.{$format}");

    }
}
