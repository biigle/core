<?php

namespace Dias\Observers;

use Exception;

class ImageObserver
{
    /**
     * An image must not be created without belonging to a transect.
     * The `transect_id` is nullable in the database to be able to mark the image
     * for deletion (with all its files), so this has to be checked manually and
     * not by the database.
     * 
     * @param \Dias\Image $image
     * @return bool
     */
    public function creating($image)
    {
        if ($image->transect === null) {
            throw new Exception('An image must not be created without belonging to a transect!');
        }

        return true;
    }
}
