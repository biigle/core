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
        $hasTiledImages = $this->hasTiledImages($diskTiles);

        if (!$this->hasThumbnail($diskThumb) || $this->shouldBeTiled() && !$hasTiledImages) {
            ProcessNewImage::dispatch($this->image);
            return;
        }
        $format = config('thumbnails.format');
        $diskThumb->copy($this->prefix.".{$format}", $this->copyPrefix.".{$format}");

        if ($hasTiledImages) {
            $files = $diskTiles->allFiles($this->prefix);
            foreach ($files as $file) {
                $fileName = str_replace("{$this->prefix}/", "", $file);
                $diskTiles->copy($file, "{$this->copyPrefix}/{$fileName}");
            }
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
        
    /**
     * Determine if an image should be tiled.
     *
     * @return bool
     */
    protected function shouldBeTiled()
    {
        if ($this->image->tiled && $this->image->tilingInProgress) {
            return false;
        }

        $threshold = config('image.tiles.threshold');
        return $this->image->width > $threshold || $this->image->height > $threshold;
    }
}
