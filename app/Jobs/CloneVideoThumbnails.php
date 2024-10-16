<?php

namespace Biigle\Jobs;

use File;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Storage;

class CloneVideoThumbnails extends Job implements ShouldQueue
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
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        File::copyDirectory($disk->path($this->prefix), $disk->path($this->copyPrefix));
    }
}
