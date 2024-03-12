<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StorePendingVolume;
use Biigle\Http\Requests\UpdatePendingVolume;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Volume;
use DB;
use Queue;

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

        return $pv;
    }

    /**
     * Update a pending volume to create an actual volume
     *
     * @api {put} pending-volumes/:id Create a new volume (v2)
     * @apiGroup Volumes
     * @apiName UpdatePendingVolume
     * @apiPermission projectAdminAndPendingVolumeOwner
     *
     * @apiDescription When this endpoint is called, the new volume is already created. Then there are two ways forward: 1) The user wants to import annotations and/or file labels. Then the pending volume is kept and used for the next steps. 2) Otherwise the pending volume will be deleted here. In both cases the endpoint returns the pending volume (even if it was deleted) which was updated with the new volume ID.
     *
     * @apiParam {Number} id The pending volume ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new volume.
     * @apiParam (Required attributes) {String} url The base URL of the image/video files. Can be a path to a storage disk like `local://volumes/1` or a remote path like `https://example.com/volumes/1`.
     * @apiParam (Required attributes) {Array} files Array of file names of the images/videos that can be found at the base URL. Example: With the base URL `local://volumes/1` and the image `1.jpg`, the file `volumes/1/1.jpg` of the `local` storage disk will be used.
     *
     * @apiParam (Optional attributes) {String} handle Handle or DOI of the dataset that is represented by the new volume.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "created_at": "2015-02-19 16:10:17",
     *    "updated_at": "2015-02-19 16:10:17",
     *    "media_type_id": 1,
     *    "user_id": 2,
     *    "project_id": 3,
     *    "volume_id": 4
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

        // TODO: Implement annotation/file label import where this must be saved in the
        // DB.
        $request->pendingVolume->volume_id = $volume->id;

        $request->pendingVolume->delete();

        return $request->pendingVolume;
    }
}