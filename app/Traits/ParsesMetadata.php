<?php

namespace Biigle\Traits;

use duncan3dc\Bom\Util;
use Exception;
use Illuminate\Http\UploadedFile;

trait ParsesMetadata
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
     * Parse a metadata CSV string to an array.
     */
    public function parseMetadata(string $content): array
    {
        // Split string by rows but respect possible escaped linebreaks.
        $rows = str_getcsv($content, "\n");
        // Now parse individual rows.
        $rows = array_map('str_getcsv', $rows);

        $rows[0][0] = Util::removeBom($rows[0][0]);

        $rows[0] = array_map('strtolower', $rows[0]);

        $rows[0] = array_map(function ($column) {
            if (array_key_exists($column, $this->columnSynonyms)) {
                return $this->columnSynonyms[$column];
            }

            return $column;
        }, $rows[0]);

        return $rows;
    }

    /**
     * Parse metadata from a CSV file to an array.
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

        if (!array_key_exists('image-set-uuid', $header)) {
            throw new Exception("The 'image-set-uuid' key must be present.");
        }

        $url = '';
        if (array_key_exists('image-set-data-handle', $header)) {
            if (!$this->isValidHandle($header['image-set-data-handle'])) {
                throw new Exception("The 'image-set-data-handle' key must be a valid handle.");
            }

            $url = 'https://hdl.handle.net/'.$header['image-set-data-handle'];
        }

        $mediaType = 'image';

        if (array_key_exists('image-acquisition', $header) && $header['image-acquisition'] === 'video') {
            $mediaType = 'video';
        }

        $files = [];
        if (array_key_exists('image-set-items', $yaml)) {
            $files = $this->parseIfdoItems($header, $yaml['image-set-items']);
        }

        return [
            'name' => $header['image-set-name'],
            'handle' => $header['image-set-handle'],
            'uuid' => $header['image-set-uuid'],
            'url' => $url,
            'media_type' => $mediaType,
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

        // Normalize image-set-items entries. An entry can be either a list (e.g. for a
        // video) or an object (e.g. for an image). But an image could be a list with a
        // single entry, too.
        foreach ($items as &$item) {
            if (!is_array($item)) {
                $item = [null];
            } elseif (!array_key_exists(0, $item)) {
                $item = [$item];
            }
        }

        // Convert item depth to altitude.
        // Also add all metadata fields present in items (stop early).
        foreach ($items as &$subItems) {
            foreach ($subItems as &$subItem) {
                if (empty($subItem)) {
                    continue;
                }

                if (array_key_exists('image-depth', $subItem)) {
                    $subItem['image-altitude'] = -1 * $subItem['image-depth'];
                    // Save some memory for potentially huge arrays.
                    unset($subItem['image-depth']);
                }

                foreach ($leftToCheck as $ifdoField => $csvField) {
                    if (array_key_exists($ifdoField, $subItem)) {
                        $fields[] = $csvField;
                        unset($leftToCheck[$ifdoField]);
                        if (empty($leftToCheck)) {
                            break;
                        }
                    }
                }
            }
            unset($subItem); // Important to destroy by-reference variable after the loop!
        }
        unset($subItems); // Important to destroy by-reference variable after the loop!

        sort($fields);

        foreach ($items as $filename => $subItems) {
            $defaults = [];
            foreach ($subItems as $index => $subItem) {
                if ($index === 0 && is_array($subItem)) {
                    $defaults = $subItem;
                }

                $row = [$filename];
                foreach ($fields as $field) {
                    $ifdoField = $reverseFieldMap[$field];
                    if (is_array($subItem) && array_key_exists($ifdoField, $subItem)) {
                        // Take field value of subItem if it is given.
                        $row[] = $subItem[$ifdoField];
                    } elseif (array_key_exists($ifdoField, $defaults)) {
                        // Otherwise fall back to the defaults of the first subItem.
                        $row[] = $defaults[$ifdoField];
                    } elseif (array_key_exists($ifdoField, $header)) {
                        // Otherwise fall back to the defaults of the header.
                        $row[] = $header[$ifdoField];
                    } else {
                        $row[] = '';
                    }
                }

                $rows[] = $row;
            }
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
