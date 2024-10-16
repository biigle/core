<?php

namespace Biigle\Jobs;

use File;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Storage;

class CloneImageThumbnails extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    public $prefix;

    public $copyPrefix;

    public function __construct(String $prefix, String $copyPrefix)
    {
        $this->prefix = $prefix;
        $this->copyPrefix = $copyPrefix;
    }

    public function handle()
    {
        $this->copyFiles(Storage::disk(config('thumbnails.storage_disk')));
        $this->copyFiles(Storage::disk(config('image.tiles.disk')));
    }

    private function copyFiles($disk)
    {
        File::copyDirectory($disk->path($this->prefix), $disk->path($this->copyPrefix));
    }
}
