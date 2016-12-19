<?php

namespace Dias\Modules\Transects\Http\Controllers\Api;

use File;
use Exception;
use Dias\Image;
use Dias\Transect;
use Illuminate\Http\Request;
use Dias\Http\Controllers\Api\Controller;

class TransectImageMetadataController extends Controller
{
    /**
     * Available values for the columns parameter of the store route
     *
     * @var array
     */
    protected $availableColumns = ['taken_at', 'lng', 'lat'];

    /**
     * Add or update image metadata for a transect
     *
     * @api {post} transects/:id/images/metadata Add/update image metadata
     * @apiGroup Transects
     * @apiName StoreTransectImageMetadata
     * @apiPermission projectAdmin
     * @apiDescription This endpoint allows adding or updating image metadata like geo coordinates for a transect. Because the metadata is supplied as an uploaded file, this endpoint can only be accessed with a `multipart/form-data` request (not `application/json`).
     *
     * @apiParam {Number} id The transect ID.
     *
     * @apiParam (Required attributes) {File} file CSV file with image filenames in the first column and the image creation date and/or latitude and longitute in the following columns. The presence and ordering of the tree columns is specified in the columns parameter.
     * @apiParam (Required attributes) {Array} columns JSON array of column names. Available column names are: `taken_at` (Date and time when the image was taken), `lng` (Longitude), `lat` (Latitude). Each column name may occur only once. There must be at least one column name. If `lng` is present, `lat` must be present, too (and vice versa). The ordering of the columns in this array will be used for parsing the second, third and fourth column of the supplied CSV file.
     *
     * @apiParamExample {String} Request example:
     * file: 'image_1.png,2016-12-19 12:49:00,52.3211,28.775'
     * columns: ["taken_at", "lng", "lat"]
     *
     * @param Request $request
     * @param int $id Transect ID
     *
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('update', $transect);
        $this->validate($request, [
            'file' => 'required|mimetypes:text/plain,text/csv',
            'columns' => 'required|array'
        ]);


        $columns = $request->input('columns');
        $diff = array_diff($columns, $this->availableColumns);

        if (count($diff) > 0) {
            return $this->buildFailedValidationResponse($request, [
                'columns' => 'The columns array may contain only values of: '.implode(', ', $this->availableColumns).'.',
            ]);
        }

        $lng = in_array('lng', $columns);
        $lat = in_array('lat', $columns);
        if ($lng && !$lat || !$lng && $lat) {
            return $this->buildFailedValidationResponse($request, [
                'columns' => "If the 'lng' column is present, the 'lat' column must be present, too (and vice versa).",
            ]);
        }

        $csv = $request->file('file')->openFile();
        $data = $csv->fgetcsv();

        if (!$data) {
            return $this->buildFailedValidationResponse($request, [
                'file' => 'CSV file could not be read or is empty.',
            ]);
        }

        array_unshift($columns, 'filename');
        $colCount = count($columns);

        $images = $transect->images()
            ->select('id', 'filename')
            ->get()
            ->keyBy('filename');

        // isset($data[0]) skips a possible empty last line which returns [0 => null]
        while (is_array($data) && isset($data[0])) {
            if (count($data) !== $colCount) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => 'Column count in the CSV file does not match the given columns: '.implode(', ', $columns).'.',
                ]);
            }

            $filename = $data[0];
            if (!$images->has($filename)) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => "There is no image with filename {$filename}.",
                ]);
            }

            $image = $images[$filename];
            $image->fillable($this->availableColumns);
            $toFill = array_combine($columns, $data);

            if (array_key_exists('lng', $toFill) && !is_numeric($toFill['lng'])) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => "'{$toFill['lng']}' is no valid longitude for image {$filename}.",
                ]);
            }

            if (array_key_exists('lat', $toFill) && !is_numeric($toFill['lat'])) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => "'{$toFill['lat']}' is no valid latitude for image {$filename}.",
                ]);
            }

            try {
                $image->fill($toFill);
            } catch (Exception $e) {
                return $this->buildFailedValidationResponse($request, [
                    'file' => "The CSV file content could not be parsed for image {$filename}. ".$e->getMessage(),
                ]);
            }

            $data = $csv->fgetcsv();
        }

        // Wait until the loop was successfully finished before saving all the data.
        // This also saves only the images that were altered.
        foreach ($images as $image) {
            $image->save();
        }
    }
}
