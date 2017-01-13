<?php

namespace Biigle\Contracts;

use Biigle\Volume;

/**
 * A service that generates thumbnail images for newly created volumes.
 */
interface ThumbnailService
{
    /**
     * Generates the thumbnails images for the volume.
     *
     * The thumbnails are stored in the thumbnails storage directory. This function may operate
     * asynchronous, so it is not guaranteed that the thumbnails ae immediately available
     * one this function returned.
     *
     * @param Volume $volume The volume to generate the thumbnails for
     * @param array $only Array of image IDs to restrict the generating of thumbnails to. If it is empty, all images of the volume will be taken.
     */
    public function generateThumbnails(Volume $volume, array $only);
}
