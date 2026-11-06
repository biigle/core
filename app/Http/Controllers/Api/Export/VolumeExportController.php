<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Volume;

class VolumeExportController extends Controller
{
    /**
     * @api {post} export/volumes Request a volume export
     * @apiGroup Sync
     * @apiName StoreVolumeExport
     * @apiPermission admin
     * @apiDescription Exactly one of `except` or `only` must be provided (not both). The export file is generated in the background and the user is notified when it is ready. Responds with the new export file object.
     *
     * @apiParam (Optional arguments) {Number[]} except IDs of the volumes that should not be included in the export file.
     * @apiParam (Optional arguments) {Number[]} only IDs of the volumes that should only be included in the export file.
     * @apiParam (Optional arguments) {String} description A description of the export file (max. 255 characters).
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
    protected function getType(): string
    {
        return 'volumes';
    }
}
