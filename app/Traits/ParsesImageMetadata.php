<?php

namespace Biigle\Traits;

use duncan3dc\Bom\Util;
use Exception;
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
     * Maps iFDO field names to BIIGLE metadata CSV fields.
     *
     * @var array
     */
    protected $ifdoFieldMap = [
        'image-area-square-meter' => 'area',
        'image-meters-above-ground' => 'distance_to_ground',
        'image-altitude' => 'gps_altitude',
        'image-latitude' => 'lat',
        'image-longitude' => 'lng',
        'image-datetime' => 'taken_at',
        'image-camera-yaw-degrees' => 'yaw',
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

    /**
     * Parse a volume metadata iFDO YAML string to an array.
     *
     * See: https://marine-imaging.com/fair/ifdos/iFDO-overview/
     *
     * @param string $content
     *
     * @return array
     */
    public function parseIfdo($content)
    {
        try {
            $yaml = yaml_parse($content);
        } catch (Exception $e) {
            throw new Exception("The YAML file could not be parsed.");
        }

        if (!is_array($yaml)) {
            throw new Exception("The file does not seem to be a valid iFDO.");
        }

        if (!array_key_exists('image-set-header', $yaml)) {
            throw new Exception("The 'image-set-header' key must be present.");
        }

        $header = $yaml['image-set-header'];

        if (!array_key_exists('image-set-name', $header)) {
            throw new Exception("The 'image-set-name' key must be present.");
        }

        if (!array_key_exists('image-set-handle', $header)) {
            throw new Exception("The 'image-set-handle' key must be present.");
        }

        if (!$this->isValidHandle($header['image-set-handle'])) {
            throw new Exception("The 'image-set-handle' key must be a valid handle.");
        }

        $url = '';
        if (array_key_exists('image-set-data-handle', $header)) {
            if (!$this->isValidHandle($header['image-set-data-handle'])) {
                throw new Exception("The 'image-set-data-handle' key must be a valid handle.");
            }

            $url = 'https://hdl.handle.net/'.$header['image-set-data-handle'];
        }

        if (array_key_exists('image-set-acquisition', $header) && $header['image-set-acquisition'] === 'video') {
            throw new Exception('Video metadata import is currently not supported.');
        }

        $files = [];
        if (array_key_exists('image-set-items', $yaml)) {
            $files = $this->parseIfdoItems($header, $yaml['image-set-items']);
        }

        return [
            'name' => $header['image-set-name'],
            'handle' => $header['image-set-handle'],
            'url' => $url,
            'media_type' => 'image',
            'files' => $files,
        ];
    }

    /**
     * Parse a volume metadata iFDO YAML file to an array.
     *
     * @param UploadedFile $file
     *
     * @return array
     */
    public function parseIfdoFile(UploadedFile $file)
    {
        return $this->parseIfdo($file->get());
    }

    /**
     * Parse iFDO image-set-items to a CSV-like metadata array that can be parsed by
     * `parseMetadata` if converted to a string.
     *
     * @param array $header iFDO image-set-header
     * @param array $items iFDO image-set-items. Passed by reference so potentially huge arrays are not copied.
     *
     * @return array
     */
    protected function parseIfdoItems($header, &$items)
    {
        $fields = [];
        $rows = [];
        $reverseFieldMap = array_flip($this->ifdoFieldMap);

        if (array_key_exists('image-depth', $header)) {
            $header['image-altitude'] = -1 * $header['image-depth'];
        }

        $leftToCheck = $this->ifdoFieldMap;

        // Add all metadata fields present in header.
        foreach ($leftToCheck as $ifdoField => $csvField) {
            if (array_key_exists($ifdoField, $header)) {
                $fields[] = $csvField;
                unset($leftToCheck[$ifdoField]);
            }
        }

        // Convert item depth to altitude.
        // Also add all metadata fields present in items (stop early).
        foreach ($items as &$item) {
            if (!$item) {
                continue;
            }

            if (array_key_exists('image-depth', $item)) {
                $item['image-altitude'] = -1 * $item['image-depth'];
                // Save some memory for potentially huge arrays.
                unset($item['image-depth']);
            }

            foreach ($leftToCheck as $ifdoField => $csvField) {
                if (array_key_exists($ifdoField, $item)) {
                    $fields[] = $csvField;
                    unset($leftToCheck[$ifdoField]);
                    if (empty($leftToCheck)) {
                        break;
                    }
                }
            }
        }
        // Important to destroy by-reference variable after the loop!
        unset($item);

        sort($fields);

        foreach ($items as $filename => $item) {
            $row = [$filename];
            foreach ($fields as $field) {
                $ifdoField = $reverseFieldMap[$field];
                if (is_array($item) && array_key_exists($ifdoField, $item)) {
                    $row[] = $item[$ifdoField];
                } elseif (array_key_exists($ifdoField, $header)) {
                    $row[] = $header[$ifdoField];
                } else {
                    $row[] = '';
                }
            }

            $rows[] = $row;
        }

        // Add this only not because it should not be included in sort earlier and it is
        // should be skipped in the loop above.
        array_unshift($fields, 'filename');
        array_unshift($rows, $fields);

        return $rows;
    }

    /**
     * Determine if a value is a valid handle.
     *
     * @param string $value
     *
     * @return boolean
     */
    protected function isValidHandle($value)
    {
        return preg_match('/[^\/]+\/[^\/]/', $value);
    }
}
