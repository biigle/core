<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreVolumeMetadata;
use Biigle\Jobs\UpdateVolumeMetadata;
use Biigle\Volume;
use Illuminate\Http\Response;
use Queue;
use Storage;

class MetadataController extends Controller
{
    /**
     * Get a metadata file attached to a volume
     *
     * @api {get} volumes/:id/metadata Get a metadata file
     * @apiGroup Volumes
     * @apiName ShowVolumeMetadata
     * @apiPermission projectMember
     ~
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if (!$volume->hasMetadata()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $disk = Storage::disk(config('volumes.metadata_storage_disk'));
        $suffix = pathinfo($volume->metadata_file_path, PATHINFO_EXTENSION);

        return $disk->download($volume->metadata_file_path, "biigle-volume-{$volume->id}-metadata.{$suffix}");
    }

    /**
     * @api {post} volumes/:id/images/metadata Add image metadata
     * @apiDeprecated use now (#Volumes:StoreVolumeMetadata).
     * @apiGroup Volumes
     * @apiName StoreVolumeImageMetadata
     * @apiPermission projectAdmin
     */

    /**
     * Add or update file metadata for a volume.
     *
     * @api {post} volumes/:id/metadata Add file metadata
     * @apiGroup Volumes
     * @apiName StoreVolumeMetadata
     * @apiPermission projectAdmin
     * @apiDescription This endpoint allows adding or updating metadata such as geo
     * coordinates for volume files. The uploaded metadata file replaces any previously
     * uploaded file.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (attributes) {File} file A file with volume and image/video metadata. By default, this can be a CSV. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp. Other file formats may be supported through modules.
     * @apiParam (attributes) {String} parser The class namespace of the metadata parser to use. The default CSV parsers are: `Biigle\Services\MetadataParsing\ImageCsvParser` and `Biigle\Services\MetadataParsing\VideoCsvParser`.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
     *
     * @param StoreVolumeMetadata $request
     *
     * @return \Illuminate\Http\Response
     */
    public function store(StoreVolumeMetadata $request)
    {
        // Delete first because the metadata file may have a different extension, so it
        // is not guaranteed that the file is overwritten.
        $request->volume->deleteMetadata();
        $request->volume->saveMetadata($request->file('file'));
        $request->volume->update(['metadata_parser' => $request->input('metadata_parser')]);
        Queue::push(new UpdateVolumeMetadata($request->volume));
    }

    /**
     * Delete a metadata file attached to a volume
     *
     * @api {delete} volumes/:id/metadata Delete a metadata file
     * @apiGroup Volumes
     * @apiName DestroyVolumeMetadata
     * @apiPermission projectAdmin
     * @apiDescription This does not delete the metadata that was already attached to the
     * volume files.
     ~
     * @param int $id
     *
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);
        $volume->deleteMetadata();
    }
}
