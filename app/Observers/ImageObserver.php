<?php

namespace Biigle\Observers;

use Biigle\Image;
use Biigle\Events\ImagesDeleted;
use Biigle\Events\TiledImagesDeleted;

class ImageObserver
{
    /**
     * Handle the event of deleting a single image.
     *
     * @param Image $image
     * @return bool
     */
    public function deleting(Image $image)
    {
        event(new ImagesDeleted($image->uuid));
        if ($image->tiled) {
            event(new TiledImagesDeleted($image->uuid));
        }

        if ($image->id === $image->volume->thumbnail->id) {
            $image->volume->flushThumbnailCache();
        }

        return true;
    }
}
