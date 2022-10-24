<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class ImageMetadata implements Rule
{
    /**
     * Allowed columns for the metadata information to change image attributes.
     *
     * @var array
     */
    const ALLOWED_ATTRIBUTES = [
        'lat',
        'lng',
        'taken_at',
    ];

    /**
     * Allowed columns for the metadata information to change image metadata.
     *
     * @var array
     */
    const ALLOWED_METADATA = [
        'area',
        'distance_to_ground',
        'gps_altitude',
        'yaw',
    ];

    /**
     * All numeric metadata fields (keys) with description (values).
     *
     * @var array
     */
    const NUMERIC_FIELDS = [
        'area' => 'area',
        'distance_to_ground' => 'distance to ground',
        'gps_altitude' => 'GPS altitude',
        'lat' => 'latitude',
        'lng' => 'longitude',
        'yaw' => 'yaw',
    ];

    /**
     * Array of volume file names.
     *
     * @var array
     */
    protected $files;

    /**
     * The validation error message.
     *
     * @var string
     */
    protected $message;

    /**
     * Create a new instance.
     *
     * @param array $files
     */
    public function __construct($files)
    {
        $this->files = $files;
        $this->message = "The :attribute is invalid.";
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  array  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (!is_array($value)) {
            return false;
        }

        // This checks if any information is given at all.
        if (empty($value)) {
            $this->message = 'The metadata information is empty.';

            return false;
        }

        $columns = array_shift($value);

        // This checks if any information is given beside the column description.
        if (empty($value)) {
            $this->message = 'The metadata information is empty.';

            return false;
        }

        if (!in_array('filename', $columns)) {
            $this->message = 'The filename column is required.';

            return false;
        }

        $colCount = count($columns);

        if ($colCount === 1) {
            $this->message = 'No metadata columns given.';

            return false;
        }

        if ($colCount !== count(array_unique($columns))) {
            $this->message = 'Each column may occur only once.';

            return false;
        }

        $allowedColumns = array_merge(['filename'], self::ALLOWED_ATTRIBUTES, self::ALLOWED_METADATA);
        $diff = array_diff($columns, $allowedColumns);

        if (count($diff) > 0) {
            $this->message = 'The columns array may contain only values of: '.implode(', ', $allowedColumns).'.';

            return false;
        }

        $lng = in_array('lng', $columns);
        $lat = in_array('lat', $columns);
        if ($lng && !$lat || !$lng && $lat) {
            $this->message = "If the 'lng' column is present, the 'lat' column must be present, too (and vice versa).";

            return false;
        }

        foreach ($value as $index => $row) {
            // +1 since index starts at 0.
            // +1 since column description row was removed above.
            $line = $index + 2;

            if (count($row) !== $colCount) {
                $this->message = "Invalid column count in line {$line}.";

                return false;
            }

            $combined = array_combine($columns, $row);
            $combined = array_filter($combined);
            if (!array_key_exists('filename', $combined)) {
                $this->message = "Filename missing in line {$line}.";

                return false;
            }

            $filename = $combined['filename'];

            if (!in_array($filename, $this->files)) {
                $this->message = "There is no file with filename {$filename}.";

                return false;
            }

            if (array_key_exists('lng', $combined)) {
                $lng = $combined['lng'];
                if (!is_numeric($lng) || abs($lng) > 180) {
                    $this->message = "'{$lng}' is no valid longitude for file {$filename}.";

                    return false;
                }


                if (!array_key_exists('lat', $combined)) {
                    $this->message = "Missing latitude for file {$filename}.";

                    return false;
                }
            }

            if (array_key_exists('lat', $combined)) {
                $lat = $combined['lat'];
                if (!is_numeric($lat) || abs($lat) > 90) {
                    $this->message = "'{$lat}' is no valid latitude for file {$filename}.";

                    return false;
                }

                if (!array_key_exists('lng', $combined)) {
                    $this->message = "Missing longitude for file {$filename}.";

                    return false;
                }
            }

            // Catch both a malformed date (false) and the zero date (negative integer).
            if (array_key_exists('taken_at', $combined)) {
                $date = $combined['taken_at'];
                if (!(strtotime($date) > 0)) {
                    $this->message = "'{$date}' is no valid date for file {$filename}.";

                    return false;
                }
            }

            foreach (self::NUMERIC_FIELDS as $key => $text) {
                if (array_key_exists($key, $combined) && !is_numeric($combined[$key])) {
                    $this->message = "'{$combined[$key]}' is no valid {$text} for file {$filename}.";

                    return false;
                }
            }

            if (array_key_exists('yaw', $combined)) {
                if ($combined['yaw'] < 0 || $combined['yaw'] > 360) {
                    $this->message = "'{$combined['yaw']}' is no valid yaw for file {$filename}.";

                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->message;
    }
}
