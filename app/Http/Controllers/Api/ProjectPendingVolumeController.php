<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StorePendingVolume;

class ProjectPendingVolumeController extends Controller
{
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
     * @apiParam (Optional attributes) {File} metadata_file A file with volume and image/video metadata. By default, this can be a CSV. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp. Other formats may be supported through modules.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
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

    // TODO implement update() endpoint to create the volume and optionally continue to
    // import annotations/file labels.
    // See: https://github.com/biigle/core/issues/701#issue-2000484824
}
