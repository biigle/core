<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Volume;

class VolumeExportController extends Controller
{
    protected function getQuery()
    {
        return Volume::getQuery();
    }

    protected function getType(): string
    {
        return 'volumes';
    }

    protected function getExportFilename()
    {
        return 'biigle_volume_export.zip';
    }
}
