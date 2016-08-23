<?php

namespace Dias\Modules\Export;

use Exception;
use Dias\Transect as BaseTransect;

/**
 * Extends the base Dias transect
 */
class Transect extends BaseTransect {

    /**
     * Name of the attribute that stores export area rectangle for the transect
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
     * Converts a regular Dias transect to an export transect
     *
     * @param BaseTransect $transect Regular Dias transect instance
     *
     * @return Transect
     */
    public static function convert(BaseTransect $transect)
    {
        $instance = new static;
        $instance->setRawAttributes($transect->attributes);
        $instance->exists = $transect->exists;
        return $instance->setRelations($transect->relations);
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
