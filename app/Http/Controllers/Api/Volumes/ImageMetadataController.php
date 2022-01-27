<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreVolumeMetadata;
use Biigle\Rules\ImageMetadata;
use Carbon\Carbon;
use DB;

class ImageMetadataController extends Controller
{
    /**
     * Add or update image metadata for a volume.
     *
     * @api {post} volumes/:id/images/metadata Add image metadata
     * @apiGroup Volumes
     * @apiName StoreVolumeImageMetadata
     * @apiPermission projectAdmin
     * @apiDescription This endpoint allows adding or updating image metadata like geo coordinates for volume images. Because the metadata is supplied as an uploaded file, this endpoint can only be accessed with a `multipart/form-data` request (not `application/json`).
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required attributes) {File} metadata_csv CSV file with metadata for the volume images. See "metadata columns" for the possible columns. Each column may occur only once. There must be at least one column other than `filename`. Alternatively, `metadata_text` can be used directly with the content of a CSV file.
     * @apiParam (Required attributes) {String} metadata_text Alternative to `metadata_csv` with the plain content of a metadata CSV file.
     *
     * @apiParam (metadata columns) {String} filename The filename of the image the metadata belongs to. This column is required.
     * @apiParam (metadata columns) {String} taken_at The date and time where the image was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (metadata columns) {Number} lng Longitude where the image was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (metadata columns) {Number} lat Latitude where the image was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (metadata columns) {Number} gps_altitude GPS Altitude where the image was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (metadata columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     * @apiParam (metadata columns) {Number} area Area shown by the image in m². Example `2.6`.
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
        DB::transaction(function () use ($request) {
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
        });

        $request->volume->flushGeoInfoCache();
    }
}
