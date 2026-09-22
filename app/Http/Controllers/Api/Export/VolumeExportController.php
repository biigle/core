<?php

namespace Biigle\Http\Controllers\Api\Export;

use Biigle\Http\Requests\StoreVolumeExport;
use Biigle\Jobs\GenerateVolumeExportJob;
use Biigle\Services\Export\VolumeExport;
use Biigle\Volume;
use Biigle\VolumeExport as VolumeExportModel;

class VolumeExportController extends Controller
{
    /**
     * @api {post} export/volumes Request volume export
     * @apiGroup Sync
     * @apiName StoreVolumeExport
     *
     * @apiParam (Optional arguments) {String} description Description of the export.
     * @apiParam (Optional arguments) {String} except Comma separated IDs of the volumes that should not be included in the export.
     * @apiParam (Optional arguments) {String} only Comma separated IDs of the volumes that should only be included in the export.
     * @apiDescription Exactly one of `except` or `only` must be provided (not both). The response acknowledges the queued volume export.
     * @apiPermission admin
     */
    public function store(StoreVolumeExport $request)
    {
        if (!$this->isAllowed()) {
            abort(404);
        }

        $export = new VolumeExportModel;
        $export->user()->associate($request->user());
        $export->description = $request->input('description');
        $export->volume_ids = $this->getIds($request);
        $export->ready_at = null;
        $export->save();

        GenerateVolumeExportJob::dispatch($export)
            ->onQueue(config('sync.generate_volume_export_queue'));

        $export->unsetRelation('user');

        return $export;
    }

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
