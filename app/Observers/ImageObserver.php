<?php

namespace Biigle\Observers;

use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;
use Biigle\Image;

class ImageObserver
{
    /**
     * Handle the event of deleting a single image.
     *
     * @param Image $image
     *
     */
    public function deleting(Image $image)
    {
        event(new ImagesDeleted($image->uuid));
        if ($image->tiled) {
            event(new TiledImagesDeleted($image->uuid));
        }

        if ($image->volume->thumbnails->pluck('id')->contains($image->id)) {
            $image->volume->flushThumbnailCache();
        }
    }
}
