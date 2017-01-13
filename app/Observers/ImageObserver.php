<?php

namespace Biigle\Observers;

use Event;
use Biigle\Image;

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
        Event::fire('images.cleanup', [[$image->uuid]]);

        return true;
    }
}
