<?php

namespace Biigle\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Storage;

class CloneImageThumbnails extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * Path of original image thumbnails and tiled data
     * @var string
     */
    public $prefix;

    /**
     * Path of cloned image thumbnails and tiled data
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
        $format = config('thumbnails.format');
        Storage::disk(config('thumbnails.storage_disk'))->copy($this->prefix.".{$format}", $this->copyPrefix.".{$format}");

        $disk = Storage::disk(config('image.tiles.disk'));
        $files = $disk->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $disk->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }
}
