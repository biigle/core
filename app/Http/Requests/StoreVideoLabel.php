<?php

namespace Biigle\Http\Requests;

use Biigle\Video;

class StoreVideoLabel extends StoreVolumeFileLabel
{
    /**
     * Get the file model class;
     *
     * @return string
     */
    protected function getFileModel()
    {
        return Video::class;
    }
}
