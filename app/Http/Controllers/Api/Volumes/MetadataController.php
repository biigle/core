<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreVolumeMetadata;
use Biigle\Rules\ImageMetadata;
use Carbon\Carbon;
use DB;

class MetadataController extends Controller
{
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
     * @apiDescription This endpoint allows adding or updating metadata such as geo coordinates for volume file.
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Attributes) {String} metadata_text CSV-like string with file metadata. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. For video metadata, multiple rows can contain metadata from different times of the same video. In this case, the `filename` of the rows must match and each row needs a (different) `taken_at` timestamp.
     * @apiParam (Attributes) {File} metadata_csv Alternative to `metadata_text`. This field allows the upload of an actual CSV file. See `metadata_text` for the further description.
     * @apiParam (Attributes) {File} ifdo_file iFDO metadata file to upload and link with the volume. The metadata of this file is not used for the volume or volume files. Use `metadata_text` or `metadata_csv` for this.
     *
     * @apiParam (metadata columns) {String} filename The filename of the file the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the file was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the file was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the file was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the file was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the file in m². Example `2.6`.
     *
     * @apiParamExample {String} Request example:
     * file: "filename,taken_at,lng,lat,gps_altitude,distance_to_ground,area
     * image_1.png,2016-12-19 12:49:00,52.3211,28.775,-1500.5,30.25,2.6"
     *
     * @param StoreVolumeMetadata $request
     *
     * @return \Illuminate\Http\Response
     */
    public function store(StoreVolumeMetadata $request)
    {
        if ($request->hasFile('ifdo_file')) {
            $request->volume->saveIfdo($request->file('ifdo_file'));
        }

        if ($request->input('metadata')) {
            DB::transaction(function () use ($request) {
                $this->updateMetadata($request);
            });

            $request->volume->flushGeoInfoCache();
        }
    }

    /**
     * Update volume metadata for each image.
     *
     * @param StoreVolumeMetadata $request
     */
    protected function updateMetadata(StoreVolumeMetadata $request)
    {
        $metadata = $request->input('metadata');
        $images = $request->volume->images()
            ->select('id', 'filename', 'attrs')
            ->get()
            ->keyBy('filename');

        $columns = array_shift($metadata);

        foreach ($metadata as $row) {
            $row = collect(array_combine($columns, $row));
            $image = $images->get($row['filename']);
            // Remove empty cells.
            $row = $row->filter();
            $fill = $row->only(ImageMetadata::ALLOWED_ATTRIBUTES);
            if ($fill->has('taken_at')) {
                $fill['taken_at'] = Carbon::parse($fill['taken_at'])->toDateTimeString();
            }
            $image->fillable(ImageMetadata::ALLOWED_ATTRIBUTES);
            $image->fill($fill->toArray());

            $metadata = $row->only(ImageMetadata::ALLOWED_METADATA);
            $image->metadata = array_merge($image->metadata, $metadata->toArray());
            $image->save();
        }
    }
}
