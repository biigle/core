<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Export;

use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Volume;

class VolumeExportController extends Controller
{
    /**
     * @api {get} export/volumes Get volume export
     * @apiGroup Sync
     * @apiName ShowVolumeExport
     *
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the volumes that should not be included in the export file.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the volumes that should only be included in the export file.
     * @apiDescription The response is a ZIP archive that can be used for the volume import. By default all volumes are exported.
     * @apiPermission admin
     */

    /**
     * {@inheritdoc}
     */
    protected function getQuery()
    {
        return Volume::getQuery();
    }

    /**
     * {@inheritdoc}
     */
    protected function getExport(array $ids)
    {
        return new VolumeExport($ids);
    }

    /**
     * {@inheritdoc}
     */
    protected function getExportFilename()
    {
        return 'biigle_volume_export.zip';
    }

    /**
     * {@inheritdoc}
     */
    protected function isAllowed()
    {
        return in_array('volumes', config('sync.allowed_exports'));
    }
}
