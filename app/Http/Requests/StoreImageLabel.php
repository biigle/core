<?php

namespace Biigle\Http\Requests;

use Biigle\Image;

class StoreImageLabel extends StoreVolumeFileLabel
{
    /**
     * Get the file model class;
     *
     * @return string
     */
    protected function getFileModel()
    {
        return Image::class;
    }
}
