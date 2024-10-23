<?php

namespace Biigle\Jobs;

use Biigle\Image;
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

    /**
     * Cloned image of cloned volume
     * @var Image
     */
    public $image;

    public function __construct(Image $img, String $prefix)
    {
        $this->image = $img;
        $this->prefix = $prefix;
        $this->copyPrefix = fragment_uuid_path($img->uuid);
    }

    public function handle()
    {
        if (!$this->hasThumbnail() || !$this->hasTiledImages()) {
            ProcessNewImage::dispatch($this->image);
            return;
        }

        $format = config('thumbnails.format');
        Storage::disk(config('thumbnails.storage_disk'))->copy($this->prefix.".{$format}", $this->copyPrefix.".{$format}");

        $disk = Storage::disk(config('image.tiles.disk'));
        $files = $disk->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $disk->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }

    private function hasThumbnail()
    {
        $format = config('thumbnails.format');
        return Storage::disk(config('thumbnails.storage_disk'))->exists("{$this->prefix}.{$format}");
    }

    private function hasTiledImages()
    {
        return Storage::disk(config('image.tiles.disk'))->exists("{$this->prefix}/ImageProperties.xml");
    }
}
