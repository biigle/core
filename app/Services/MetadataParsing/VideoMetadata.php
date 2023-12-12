<?php

namespace Biigle\Services\MetadataParsing;

use Illuminate\Support\Collection;

class VideoMetadata extends FileMetadata
{
    public Collection $frames;

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

        $this->frames = collect([]);

        if (!is_null($takenAt)) {
            $this->addFrame(
                takenAt: $takenAt,
                lat: $lat,
                lng: $lng,
                area: $area,
                distanceToGround: $distanceToGround,
                gpsAltitude: $gpsAltitude,
                yaw: $yaw
            );
        }
    }

    public function getFrames(): Collection
    {
        return $this->frames;
    }

    public function addFrame(
        string $takenAt,
        ?float $lat = null,
        ?float $lng = null,
        ?float $area = null,
        ?float $distanceToGround = null,
        ?float $gpsAltitude = null,
        ?float $yaw = null
    ): void
    {
        $frame = new ImageMetadata(
            name: $this->name,
            takenAt: $takenAt,
            lat: $lat,
            lng: $lng,
            area: $area,
            distanceToGround: $distanceToGround,
            gpsAltitude: $gpsAltitude,
            yaw: $yaw
        );
        $this->frames->push($frame);
    }

    /**
     * Determines if any metadata field other than the name is filled.
     */
    public function isEmpty(): bool
    {
        return $this->frames->isEmpty()
            && is_null($this->lat)
            && is_null($this->lng)
            && is_null($this->takenAt)
            && is_null($this->area)
            && is_null($this->distanceToGround)
            && is_null($this->gpsAltitude)
            && is_null($this->yaw);
    }
}
