<?php

namespace Dias\Observers;

use Dias\Image;
use Exception;

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
        event('images.cleanup', [[$image->id]]);

        return true;
    }
}
