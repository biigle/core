<?php

namespace Biigle\Modules\Reports;

use Biigle\Volume as BaseVolume;
use Exception;

/**
 * Extends the base Biigle volume.
 */
class Volume extends BaseVolume
{
    /**
     * Name of the attribute that stores export area rectangle for the volume.
     *
     * @var string
     */
    const EXPORT_AREA_ATTRIBUTE = 'export_area';

    /**
     * Converts a regular Biigle volume to an export volume.
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
     * Return the dynamic attribute for the export area.
     *
     * @return array
     */
    public function getExportAreaAttribute()
    {
        return $this->getJsonAttr(self::EXPORT_AREA_ATTRIBUTE);
    }

    /**
     * Set or update the dynamic attribute for the export area.
     *
     * @param array $value The value to set
     */
    public function setExportAreaAttribute($value)
    {
        if (!is_array($value) && !is_null($value)) {
            throw new Exception('Export area coordinates must be an array!');
        }

        if ($value !== null) {
            if (sizeof($value) !== 4) {
                throw new Exception('Malformed export area coordinates!');
            }

            foreach ($value as $coordinate) {
                if (!is_int($coordinate)) {
                    throw new Exception('Malformed export area coordinates!');
                }
            }
        }

        $this->setJsonAttr(self::EXPORT_AREA_ATTRIBUTE, $value);
    }
}
