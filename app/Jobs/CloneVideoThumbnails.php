<?php

namespace Biigle\Jobs;

use Storage;
use Biigle\Video;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

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

    public $video;

    public function __construct(Video $video, String $prefix)
    {   
        $this->video = $video;
        $this->prefix = $prefix;
        $this->copyPrefix = fragment_uuid_path($video->uuid);
    }

    public function handle()
    {
        if(!$this->hasThumbnails() || !$this->hasSprites()){
            ProcessNewVideo::dispatch($this->video);
        }

        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $files = $disk->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $disk->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }

    private function hasThumbnails(){
        $format = config('thumbnails.format');
        return Storage::disk(config('videos.thumbnail_storage_disk'))->exists("{$this->prefix}/0.{$format}");
    }
    private function hasSprites(){
        $format = config('videos.sprites_format');
        return Storage::disk(config('videos.thumbnail_storage_disk'))->exists("{$this->prefix}/sprite_0.{$format}");

    }
}
