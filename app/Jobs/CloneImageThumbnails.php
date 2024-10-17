<?php

namespace Biigle\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
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
        $format = config('thumbnails.format');
        Storage::disk(config('thumbnails.storage_disk'))->copy($this->prefix.".{$format}", $this->copyPrefix.".{$format}");

        $disk = Storage::disk(config('image.tiles.disk'));
        File::copyDirectory($disk->path($this->prefix), $disk->path($this->copyPrefix));
    }
}
