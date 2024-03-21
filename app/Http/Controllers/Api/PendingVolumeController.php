<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StorePendingVolume;
use Biigle\Http\Requests\UpdatePendingVolume;
use Biigle\Http\Requests\UpdatePendingVolumeAnnotationLabels;
use Biigle\Http\Requests\UpdatePendingVolumeFileLabels;
use Biigle\Http\Requests\UpdatePendingVolumeLabelMap;
use Biigle\Http\Requests\UpdatePendingVolumeUserMap;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\PendingVolume;
use Biigle\Volume;
use DB;
use Illuminate\Http\Request;
use Queue;
use Storage;

class PendingVolumeController extends Controller
{
    /**
     * Limit for the number of files above which volume files are created asynchronously.
     *
     * @var int
     */
    const CREATE_SYNC_LIMIT = 10000;

    /**
     * Creates a new pending volume associated to the specified project.
     *
     * @api {post} projects/:id/pending-volumes Create a new pending volume
     * @apiGroup Volumes
     * @apiName StoreProjectPendingVolumes
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} media_type The media type of the new volume (`image` or `video`).
     *
     * @apiParam (Optional attributes) {File} metadata_file A file with volume and image/video metadata. By default, this can be a CSV. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp. Other file formats may be supported through modules.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": null
     * }
     */
    public function store(StorePendingVolume $request)
    {
        $pv = $request->project->pendingVolumes()->create([
            'media_type_id' => $request->input('media_type_id'),
            'user_id' => $request->user()->id,
        ]);

        if ($request->has('metadata_file')) {
            $pv->saveMetadata($request->file('metadata_file'));
        }

        if ($this->isAutomatedRequest()) {
            return $pv;
        }

        return redirect()->route('pending-volume', $pv->id);
    }

    /**
     * Update a pending volume to create an actual volume
     *
     * @api {put} pending-volumes/:id Create a new volume (v2)
     * @apiGroup Volumes
     * @apiName UpdatePendingVolume
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription When this endpoint is called, the new volume is already created. Then there are two ways forward: 1) The user wants to import annotations and/or file labels. Then the pending volume is kept and used for the next steps (see the `import_*` attributes). Continue with (#Volumes:UpdatePendingVolumeAnnotationLabels) in this case. 2) Otherwise the pending volume will be deleted here. In both cases the endpoint returns the pending volume (even if it was deleted) which was updated with the new volume ID.
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new volume.
     * @apiParam (Required attributes) {String} url The base URL of the image/video files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {Array} files Array of file names of the images/videos that can be found at the base URL. Example: With the base URL `local://volumes/1` and the image `1.jpg`, the file `volumes/1/1.jpg` of the `local` storage disk will be used. This can also be a plain string of comma-separated filenames.
     *
     * @apiParam (Optional attributes) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     * @apiParam (Optional attributes) {Boolean} import_annotations Set to `true` to keep the pending volume for annotation import. Otherwise the pending volume will be deleted after this request.
     * @apiParam (Optional attributes) {Boolean} import_file_labels Set to `true` to keep the pending volume for file label import. Otherwise the pending volume will be deleted after this request.
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
     *    "import_file_labels": false
     * }
     *
     */
    public function update(UpdatePendingVolume $request)
    {
        $volume = DB::transaction(function () use ($request) {
            $volume = Volume::create([
                'name' => $request->input('name'),
                'url' => $request->input('url'),
                'media_type_id' => $request->pendingVolume->media_type_id,
                'handle' => $request->input('handle'),
                'creator_id' => $request->user()->id,
            ]);

            $request->pendingVolume->project->volumes()->attach($volume);

            if ($request->pendingVolume->hasMetadata()) {
                $volume->update([
                    'metadata_file_path' => $volume->id.'.'.pathinfo($request->pendingVolume->metadata_file_path, PATHINFO_EXTENSION)
                ]);
                $stream = Storage::disk(config('volumes.pending_metadata_storage_disk'))
                    ->readStream($request->pendingVolume->metadata_file_path);
                Storage::disk(config('volumes.metadata_storage_disk'))
                    ->writeStream($volume->metadata_file_path, $stream);
            }

            $files = $request->input('files');

            // If too many files should be created, do this asynchronously in the
            // background. Else the script will run in the 30s execution timeout.
            $job = new CreateNewImagesOrVideos($volume, $files);
            if (count($files) > self::CREATE_SYNC_LIMIT) {
                Queue::pushOn('high', $job);
                $volume->creating_async = true;
                $volume->save();
            } else {
                Queue::connection('sync')->push($job);
            }

            return $volume;
        });

        if ($request->input('import_annotations') || $request->input('import_file_labels')) {
            $request->pendingVolume->update([
                'volume_id' => $volume->id,
                'import_annotations' => $request->input('import_annotations', false),
                'import_file_labels' => $request->input('import_file_labels', false),
            ]);
        } else {
            $request->pendingVolume->volume_id = $volume->id;
            $request->pendingVolume->delete();
        }

        if ($this->isAutomatedRequest()) {
            return $request->pendingVolume;
        }

        return redirect()
            ->route('volume', $volume->id)
            ->with('message', 'Volume created.')
            ->with('messageType', 'success');
    }

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

        return $request->pendingVolume;
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

        return $request->pendingVolume;
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
        $request->pendingVolume->update([
            'label_map' => $request->input('label_map'),
        ]);

        return $request->pendingVolume;
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
        $request->pendingVolume->update([
            'user_map' => $request->input('user_map'),
        ]);

        return $request->pendingVolume;
    }

    /**
     * Delete a pending volume
     *
     * @api {delete} pending-volumes/:id Discard a pending volume
     * @apiGroup Volumes
     * @apiName DestroyPendingVolume
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @param Request $request]
     */
    public function destroy(Request $request)
    {
        $pv = PendingVolume::findOrFail($request->route('id'));
        $this->authorize('destroy', $pv);

        $pv->delete();

        if (!$this->isAutomatedRequest()) {
            return redirect()->route('create-volume', ['project' => $pv->project_id]);
        }
    }
}
