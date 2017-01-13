<?php

namespace Biigle\Modules\Export;

use Exception;
use Biigle\Volume as BaseVolume;

/**
 * Extends the base Biigle volume
 */
class Volume extends BaseVolume {

    /**
     * Name of the attribute that stores export area rectangle for the volume
     *
     * @var string
     */
    const EXPORT_AREA_ATTRIBUTE = 'export_area';

    /**
     * Validation rules for setting the export area
     *
     * @var array
     */
    public static $storeRules = [
        'coordinates' => 'required|array',
    ];

    /**
     * Converts a regular Biigle volume to an export volume
     *
     * @param BaseVolume $volume Regular Biigle volume instance
     *
     * @return Volume
     */
    public static function convert(BaseVolume $volume)
    {
        $instance = new static;
        $instance->setRawAttributes($volume->attributes);
        $instance->exists = $volume->exists;
        return $instance->setRelations($volume->relations);
    }

    /**
     * Return the dynamic attribute for the export area
     *
     * @return array
     */
    public function getExportAreaAttribute()
    {
        return array_get($this->attrs, self::EXPORT_AREA_ATTRIBUTE);
    }

    /**
     * Set or update the dynamic attribute for the export area
     *
     * @param array $value The value to set
     */
    public function setExportAreaAttribute($value)
    {
        if (!is_array($value) && !is_null($value)) {
            throw new Exception("Export area coordinates must be an array!");
        }

        $attrs = $this->attrs;

        if ($value === null) {
            unset($attrs[self::EXPORT_AREA_ATTRIBUTE]);
        } else {
            if (sizeof($value) !== 4) {
                throw new Exception("Malformed export area coordinates!");
            }

            foreach ($value as $coordinate) {
                if (!is_int($coordinate)) {
                    throw new Exception("Malformed export area coordinates!");
                }
            }

            $attrs[self::EXPORT_AREA_ATTRIBUTE] = $value;
        }

        $this->attrs = $attrs;
    }
}
