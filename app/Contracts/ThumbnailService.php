<?php

namespace Dias\Contracts;

use Dias\Transect;

/**
 * A service that generates thumbnail images for newly created transects.
 */
interface ThumbnailService
{
    /**
     * Generates the thumbnails images for the transect
     *
     * The thumbnails are stored in the thumbnails storage directory. This function may operate
     * asynchronous, so it is not guaranteed that the thumbnails ae immediately available
     * one this function returned.
     *
     * @param Transect $transect The transect to generate the thumbnails for
     */
    public function generateThumbnails(Transect $transect);
}
