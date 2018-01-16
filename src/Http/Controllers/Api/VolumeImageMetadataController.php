<?php

namespace Biigle\Modules\Volumes\Http\Controllers\Api;

use File;
use Exception;
use Biigle\Image;
use Biigle\Volume;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class VolumeImageMetadataController extends Controller
{
    /**
     * Allowed columns for the CSV file to change image attributes.
     *
     * @var array
     */
    protected $allowedAttributes = ['filename', 'taken_at', 'lng', 'lat'];

    /**
     * Allowed columns for the CSV file to change image metadata.
     *
     * @var array
     */
    protected $allowedMetadata = ['gps_altitude', 'distance_to_ground'];

    /**
     * Add or update image metadata for a volume.
     *
     * @api {post} volumes/:id/images/metadata Add/update image metadata
     * @apiGroup Volumes
     * @apiName StoreVolumeImageMetadata
     * @apiPermission projectAdmin
     * @apiDescription This endpoint allows adding or updating image metadata like geo coordinates for volume images. Because the metadata is supplied as an uploaded file, this endpoint can only be accessed with a `multipart/form-data` request (not `application/json`).
     *
     * @apiParam {Number} id The volume ID.
     *
     * @apiParam (Required attributes) {File} file CSV file with metadata for the volume images. See CSV columns for the possible columns. Each column may occur only once. There must be at least one column other than `filename`.
     *
     * @apiParam (CSV columns) {String} filename The filename of the image the metadata belongs to. This column is required.
     * @apiParam (CSV columns) {String} taken_at The date and time where the image was taken. Example: `2016-12-19 12:49:00`
     * @apiParam (CSV columns) {Number} lng Longitude where the image was taken in decimal form. If this column is present, `lat` must be present, too. Example: `52.3211`
     * @apiParam (CSV columns) {Number} lat Latitude where the image was taken in decimal form. If this column is present, `lng` must be present, too. Example: `28.775`
     * @apiParam (CSV columns) {Number} gps_altitude GPS Altitude where the image was taken in meters. Negative for below sea level. Example: `-1500.5`
     * @apiParam (CSV columns) {Number} distance_to_ground Distance to the sea floor in meters. Example: `30.25`
     *
     * @apiParamExample {String} Request example:
     * file: "filename,taken_at,lng,lat,gps_altitude,distance_to_ground
     * image_1.png,2016-12-19 12:49:00,52.3211,28.775,-1500.5,30.25"
     *
     * @param Request $request
     * @param int $id Volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);
        $this->validate($request, [
            'file' => 'required|file|mimetypes:text/plain,text/csv',
        ]);

        $csv = $request->file('file')->openFile();
        $columns = $csv->fgetcsv();

        if (!is_array($columns)) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'CSV file could not be read or is empty.',
            ]);
        }

        if (!in_array('filename', $columns)) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'The filename column is required.',
            ]);
        }

        $colCount = count($columns);

        if ($colCount === 1) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'No metadata columns given.',
            ]);
        }

        if ($colCount !== count(array_unique($columns))) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'Each column may occur only once.',
            ]);
        }

        $allowedColumns = array_merge($this->allowedAttributes, $this->allowedMetadata);
        $diff = array_diff($columns, $allowedColumns);

        if (count($diff) > 0) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'The columns array may contain only values of: '.implode(', ', $allowedColumns).'.',
            ]);
        }

        $lng = in_array('lng', $columns);
        $lat = in_array('lat', $columns);
        if ($lng && !$lat || !$lng && $lat) {
            return $this->buildFailedValidationResponse($request, [
                'file' => "If the 'lng' column is present, the 'lat' column must be present, too (and vice versa).",
            ]);
        }

        $data = $csv->fgetcsv();

        // isset($data[0]) skips a possible empty last line which returns [0 => null]
        if (!(is_array($data) && isset($data[0]))) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'The CSV file has no data rows.',
            ]);
        }

        $images = $volume->images()
            ->select('id', 'filename', 'attrs')
            ->get()
            ->keyBy('filename');

        // Read all rows of the CSV and update the image models.
        while (is_array($data) && isset($data[0])) {
            if (count($data) !== $colCount) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => 'Column count in the CSV file does not match the given columns: '.implode(', ', $columns).'.',
                ]);
            }

            $toFill = array_combine($columns, $data);
            $filename = $toFill['filename'];

            if (!$images->has($filename)) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => "There is no image with filename {$filename}.",
                ]);
            }

            $image = $images[$filename];

            try {
                $this->fillImageAttributes($image, $toFill);
                $this->fillImageMetadata($image, $toFill);
            } catch (Exception $e) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => $e->getMessage(),
                ]);
            }

            $data = $csv->fgetcsv();
        }

        // Wait until the loop was successfully finished before saving all the data.
        // This also saves only the images that were changed.
        foreach ($images as $image) {
            $image->save();
        }

        $volume->flushGeoInfoCache();
    }

    /**
     * Fill the attributes of an image.
     *
     * @param Image $image
     * @param array $toFill
     */
    protected function fillImageAttributes(Image $image, array $toFill)
    {
        $toFill = array_only($toFill, $this->allowedAttributes);
        $image->fillable($this->allowedAttributes);

        if (array_key_exists('lng', $toFill) && !is_numeric($toFill['lng'])) {
            throw new Exception("'{$toFill['lng']}' is no valid longitude for image {$image->filename}.");
        }

        if (array_key_exists('lat', $toFill) && !is_numeric($toFill['lat'])) {
            throw new Exception("'{$toFill['lat']}' is no valid latitude for image {$image->filename}.");
        }

        if (array_key_exists('taken_at', $toFill) && strtotime($toFill['taken_at']) === false) {
            throw new Exception("'{$toFill['taken_at']}' is no valid date for image {$image->filename}.");
        }

        try {
            $image->fill($toFill);
        } catch (Exception $e) {
            throw new Exception("The CSV file content could not be parsed for image {$image->filename}. ".$e->getMessage());
        }
    }

    /**
     * Fill metadata of an image.
     *
     * @param Image $image
     * @param array $toFill
     */
    protected function fillImageMetadata(Image $image, array $toFill)
    {
        $toFill = array_only($toFill, $this->allowedMetadata);

        if (array_key_exists('gps_altitude', $toFill) && !is_numeric($toFill['gps_altitude'])) {
            throw new Exception("'{$toFill['gps_altitude']}' is no valid GPS altitude for image {$image->filename}.");
        }

        if (array_key_exists('distance_to_ground', $toFill) && !is_numeric($toFill['distance_to_ground'])) {
            throw new Exception("'{$toFill['distance_to_ground']}' is no valid distance to ground for image {$image->filename}.");
        }

        try {
            $metadata = array_merge($image->metadata, $toFill);
            $image->metadata = $metadata;
        } catch (Exception $e) {
            throw new Exception("The CSV file content could not be parsed for image {$image->filename}. ".$e->getMessage());
        }
    }
}
