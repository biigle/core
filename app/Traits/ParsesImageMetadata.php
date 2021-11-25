<?php

namespace Biigle\Traits;

use duncan3dc\Bom\Util;
use Illuminate\Http\UploadedFile;

trait ParsesImageMetadata
{
    /**
     * Column name synonyms.
     *
     * @var array
     */
    protected $columnSynonyms = [
        'file' => 'filename',
        'lon' => 'lng',
        'longitude' => 'lng',
        'latitude' => 'lat',
        'heading' => 'yaw',
        'sub_datetime' => 'taken_at',
        'sub_longitude' => 'lng',
        'sub_latitude' => 'lat',
        'sub_heading' => 'yaw',
        'sub_distance' => 'distance_to_ground',
        'sub_altitude' => 'gps_altitude',

    ];

    /**
     * Parse an image metadata CSV string to an array.
     *
     * @param string $content
     *
     * @return array
     */
    public function parseMetadata($content)
    {
        // Split string by rows but respect possible escaped linebreaks.
        $rows = str_getcsv($content, "\n");
        // Now parse individual rows.
        $rows = array_map('str_getcsv', $rows);


        if (!empty($rows) && is_array($rows[0])) {
            if (!empty($rows[0])) {
                $rows[0][0] = Util::removeBom($rows[0][0]);
            }

            $rows[0] = array_map('strtolower', $rows[0]);

            $rows[0] = array_map(function ($column) {
                if (array_key_exists($column, $this->columnSynonyms)) {
                    return $this->columnSynonyms[$column];
                }

                return $column;
            }, $rows[0]);
        }

        return $rows;
    }

    /**
     * Parse image metadata from a CSV file to an array.
     *
     * @param UploadedFile $file
     *
     * @return array
     */
    public function parseMetadataFile(UploadedFile $file)
    {
        return $this->parseMetadata($file->get());
    }
}
