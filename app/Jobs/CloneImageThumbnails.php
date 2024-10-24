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
        $diskThumb = Storage::disk(config('thumbnails.storage_disk'));
        $diskTiles = Storage::disk(config('image.tiles.disk'));

        if (!$this->hasThumbnail($diskThumb) || !$this->hasTiledImages($diskTiles)) {
            ProcessNewImage::dispatch($this->image);
            return;
        }

        $format = config('thumbnails.format');
        $diskThumb->copy($this->prefix.".{$format}", $this->copyPrefix.".{$format}");

        $files = $diskTiles->allFiles($this->prefix);
        foreach ($files as $file) {
            $fileName = str_replace("{$this->prefix}/", "", $file);
            $diskTiles->copy($file, "{$this->copyPrefix}/{$fileName}");
        }
    }

    private function hasThumbnail($disk)
    {
        $format = config('thumbnails.format');
        return $disk->exists("{$this->prefix}.{$format}");
    }

    private function hasTiledImages($disk)
    {
        return $disk->exists("{$this->prefix}/ImageProperties.xml");
    }
}
