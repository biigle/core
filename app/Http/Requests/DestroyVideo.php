<?php

namespace Biigle\Http\Requests;

use Biigle\Video;

class DestroyVideo extends DestroyVolumeFile
{
    /**
     * Get the file model class name.
     *
     * @return string
     */
    protected function getFileModel()
    {
        return Video::class;
    }
}
