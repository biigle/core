<?php

namespace Biigle\Http\Requests;

use Biigle\Image;

class DestroyImage extends DestroyVolumeFile
{
    /**
     * Get the file model class name.
     *
     * @return string
     */
    protected function getFileModel()
    {
        return Image::class;
    }
}
