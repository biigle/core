<?php

namespace Biigle\Services\MetadataParsing;

class ImageMetadata extends FileMetadata
{
    public function __construct(
        public string $name,
        public ?float $lat = null,
        public ?float $lng = null,
        public ?string $takenAt = null,
        public ?float $area = null,
        public ?float $distanceToGround = null,
        public ?float $gpsAltitude = null,
        public ?float $yaw = null
    )
    {
        parent::__construct($name);
    }

    /**
     * Determines if any metadata field other than the name is filled.
     */
    public function isEmpty(): bool
    {
        return is_null($this->lat)
            && is_null($this->lng)
            && is_null($this->takenAt)
            && is_null($this->area)
            && is_null($this->distanceToGround)
            && is_null($this->gpsAltitude)
            && is_null($this->yaw);
    }
}
