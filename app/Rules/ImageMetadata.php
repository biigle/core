<?php

namespace Biigle\Rules;

use Biigle\Services\MetadataParsing\FileMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Illuminate\Contracts\Validation\Rule;

class ImageMetadata implements Rule
{
    /**
     * All numeric metadata fields (keys) with description (values).
     *
     * @var array
     */
    const NUMERIC_FIELDS = [
        'area' => 'area',
        'distanceToGround' => 'distance to ground',
        'gpsAltitude' => 'GPS altitude',
        'lat' => 'latitude',
        'lng' => 'longitude',
        'yaw' => 'yaw',
    ];

    /**
     * The validation error message.
     *
     * @var string
     */
    protected $message;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->message = "The :attribute is invalid.";
    }

    /**
     * Determine if the validation rule passes.
     */
    public function passes($attribute, $value): bool
    {
        if (!($value instanceof VolumeMetadata)) {
            throw new \Exception('No value of type '.VolumeMetadata::class.' given.');
        }

        // This checks if any information is given at all.
        if ($value->isEmpty()) {
            $this->message = 'The metadata information is empty.';

            return false;
        }

        $fileMetadata = $value->getFiles();

        foreach ($fileMetadata as $file) {
            if (!$this->fileMetadataPasses($file)) {
                return false;
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

    protected function fileMetadataPasses(FileMetadata $file)
    {
        if (!is_null($file->lng)) {
            if (!is_numeric($file->lng) || abs($file->lng) > 180) {
                $this->message = "'{$file->lng}' is no valid longitude for file {$file->name}.";

                return false;
            }

            if (is_null($file->lat)) {
                $this->message = "Missing latitude for file {$file->name}.";

                return false;
            }
        }

        if (!is_null($file->lat)) {
            if (!is_numeric($file->lat) || abs($file->lat) > 90) {
                $this->message = "'{$file->lat}' is no valid latitude for file {$file->name}.";

                return false;
            }

            if (is_null($file->lng)) {
                $this->message = "Missing longitude for file {$file->name}.";

                return false;
            }
        }

        // Catch both a malformed date (false) and the zero date (negative integer).
        if (!is_null($file->takenAt)) {
            if (!(strtotime($file->takenAt) > 0)) {
                $this->message = "'{$file->takenAt}' is no valid date for file {$file->name}.";

                return false;
            }
        }

        foreach (self::NUMERIC_FIELDS as $key => $text) {
            if (!is_null($file->$key) && !is_numeric($file->$key)) {
                $this->message = "'{$file->$key}' is no valid {$text} for file {$file->name}.";

                return false;
            }
        }

        if (!is_null($file->yaw)) {
            if ($file->yaw < 0 || $file->yaw > 360) {
                $this->message = "'{$file->yaw}' is no valid yaw for file {$file->name}.";

                return false;
            }
        }

        return true;
    }
}
