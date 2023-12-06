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
}
