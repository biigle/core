<?php

namespace Dias\Observers;

use Event;
use Exception;
use Dias\Image;

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
        Event::fire('images.cleanup', [[$image->id]]);

        return true;
    }
}
