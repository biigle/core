<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StorePendingVolumeImport;
use Biigle\Http\Requests\UpdatePendingVolumeAnnotationLabels;
use Biigle\Http\Requests\UpdatePendingVolumeFileLabels;
use Biigle\Http\Requests\UpdatePendingVolumeLabelMap;
use Biigle\Http\Requests\UpdatePendingVolumeUserMap;
use Biigle\Jobs\ImportVolumeMetadata;
use Biigle\Volume;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class PendingVolumeImportController extends Controller
{
    /**
     * Choose annotation labels for import.
     *
     * @api {put} pending-volumes/:id/annotation-labels Choose annotation labels for import
     * @apiGroup Volumes
     * @apiName UpdatePendingVolumeAnnotationLabels
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription If this endpoint is not used to set a list of label IDs, all annotations will be imported by default. Continue with (#Volumes:UpdatePendingVolumeFileLabels).
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {array} labels The label IDs (from the metadata file) that should be used to filter the annotation import.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": 4,
     *    "import_annotations": true,
     *    "import_file_labels": true,
     *    "only_annotation_labels": [123]
     * }
     */
    public function updateAnnotationLabels(UpdatePendingVolumeAnnotationLabels $request)
    {
        $request->pendingVolume->update([
            'only_annotation_labels' => $request->input('labels'),
        ]);

        if ($this->isAutomatedRequest()) {
            return $request->pendingVolume;
        }

        if ($request->pendingVolume->import_file_labels) {
            return redirect()->route('pending-volume-file-labels', $request->pendingVolume->id);
        }

        return redirect()->route('pending-volume-label-map', $request->pendingVolume->id);
    }

    /**
     * Choose file labels for import.
     *
     * @api {put} pending-volumes/:id/file-labels Choose file labels for import
     * @apiGroup Volumes
     * @apiName UpdatePendingVolumeFileLabels
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription If this endpoint is not used to set a list of label IDs, all file labels will be imported by default. Continue with (#Volumes:UpdatePendingVolumeLabels).
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {array} labels The label IDs (from the metadata file) that should be used to filter the file label import.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": 4,
     *    "import_annotations": true,
     *    "import_file_labels": true,
     *    "only_annotation_labels": [123],
     *    "only_file_labels": [456]
     * }
     */
    public function updateFileLabels(UpdatePendingVolumeFileLabels $request)
    {
        $request->pendingVolume->update([
            'only_file_labels' => $request->input('labels'),
        ]);

        if ($this->isAutomatedRequest()) {
            return $request->pendingVolume;
        }

        return redirect()->route('pending-volume-label-map', $request->pendingVolume->id);
    }

    /**
     * Match metadata labels with database labels.
     *
     * @api {put} pending-volumes/:id/label-map Match metadata labels with database labels
     * @apiGroup Volumes
     * @apiName UpdatePendingVolumeLabels
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription If this endpoint is not used to set a map of metadata label IDs to database label IDs, the import will attempt to use the metadata label UUIDs to automatically find matches. Continue with (#Volumes:UpdatePendingVolumeUsers).
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {object} label_map Map of metadata label IDs as keys and database label IDs as values.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": 4,
     *    "import_annotations": true,
     *    "import_file_labels": true,
     *    "only_annotation_labels": [123],
     *    "only_file_labels": [456],
     *    "label_map": {"123": 987, "456": 654}
     * }
     */
    public function updateLabelMap(UpdatePendingVolumeLabelMap $request)
    {
        $map = array_map('intval', $request->input('label_map'));
        $request->pendingVolume->update(['label_map' => $map]);

        if ($this->isAutomatedRequest()) {
            return $request->pendingVolume;
        }

        return redirect()->route('pending-volume-user-map', $request->pendingVolume->id);
    }

    /**
     * Match metadata users with database users.
     *
     * @api {put} pending-volumes/:id/user-map Match metadata users with database users
     * @apiGroup Volumes
     * @apiName UpdatePendingVolumeUsers
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription If this endpoint is not used to set a map of metadata user IDs to database user IDs, the import will attempt to use the metadata user UUIDs to automatically find matches. Continue with (#Volumes:UpdatePendingVolumeImport).
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {object} user_map Map of metadata user IDs as keys and database user IDs as values.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": 4,
     *    "import_annotations": true,
     *    "import_file_labels": true,
     *    "only_annotation_labels": [123],
     *    "only_file_labels": [456],
     *    "label_map": {"123": 987, "456": 654},
     *    "user_map": {"135": 246, "975": 864}
     * }
     */
    public function updateUserMap(UpdatePendingVolumeUserMap $request)
    {
        $map = array_map('intval', $request->input('user_map'));
        $request->pendingVolume->update(['user_map' => $map]);

        if ($this->isAutomatedRequest()) {
            return $request->pendingVolume;
        }

        return redirect()->route('pending-volume-finish', $request->pendingVolume->id);
    }

    /**
     * Perform the metadata annotation and/or file label import.
     *
     * @api {post} pending-volumes/:id/import Perform annotation/file label import
     * @apiGroup Volumes
     * @apiName UpdatePendingVolumeImport
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription This endpoint attempts to perform the annotation and/or file label import that can be started in (#Volumes:UpdatePendingVolume). If the import is successful, the pending volume will be deleted.
     *
     * @apiParam {Number} id The pending volume ID.
     */
    public function storeImport(StorePendingVolumeImport $request)
    {
        DB::transaction(function () use ($request) {
            $request->pendingVolume->update(['importing' => true]);
            Queue::push(new ImportVolumeMetadata($request->pendingVolume));
        });

        if (!$this->isAutomatedRequest()) {
            return redirect()
                ->route('volume', $request->pendingVolume->volume_id)
                ->with('message', 'Metadata import in progress')
                ->with('messageType', 'success');
        }
    }
}
