<?php

namespace Biigle\Jobs;

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

    public function __construct(String $prefix, String $copyPrefix)
    {
        $this->prefix = $prefix;
        $this->copyPrefix = $copyPrefix;
    }

    public function handle()
    {
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $files = $disk->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $disk->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }
}
