<?php

namespace Biigle\Services\MetadataParsing;

use Carbon\Carbon;
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
    ) {
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
    ): void {
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

    /**
     * Get the array of metadata that can be used for Model::insert();
     */
    public function getInsertData(): array
    {
        if ($this->frames->isEmpty()) {
            return $this->getInsertDataPlain();
        }

        return $this->getInsertDataFrames();

    }

    /**
     * Get the metadata insert array if no frames are present.
     */
    protected function getInsertDataPlain(): array
    {
        $data = ['filename' => $this->name];

        if (!is_null($this->lat)) {
            $data['lat'] = [$this->lat];
        }

        if (!is_null($this->lng)) {
            $data['lng'] = [$this->lng];
        }

        $attrs = [];

        if (!is_null($this->area)) {
            $attrs['area'] = [$this->area];
        }

        if (!is_null($this->distanceToGround)) {
            $attrs['distance_to_ground'] = [$this->distanceToGround];
        }

        if (!is_null($this->gpsAltitude)) {
            $attrs['gps_altitude'] = [$this->gpsAltitude];
        }

        if (!is_null($this->yaw)) {
            $attrs['yaw'] = [$this->yaw];
        }

        if (!empty($attrs)) {
            $data['attrs'] = ['metadata' => $attrs];
        }

        return $data;
    }

    /**
     * Get the metadata insert array from all frames, sorted by taken_at.
     * If one frame has data that another frame doesn't have, it is added as null.
     */
    protected function getInsertDataFrames(): array
    {
        $data = [
            'lat' => [],
            'lng' => [],
            'taken_at' => [],
        ];

        $attrs = [
            'area' => [],
            'distance_to_ground' => [],
            'gps_altitude' => [],
            'yaw' => [],
        ];

        $timestamps = $this->frames
            ->map(fn ($f) => Carbon::parse($f->takenAt))
            ->sort(fn ($a, $b) => $a->gt($b) ? 1 : -1);

        foreach ($timestamps as $index => $timestamp) {
            $frame = $this->frames->get($index);
            $data['lat'][] = $frame->lat;
            $data['lng'][] = $frame->lng;
            $data['taken_at'][] = $timestamp->toDateTimeString();

            $attrs['area'][] = $frame->area;
            $attrs['distance_to_ground'][] = $frame->distanceToGround;
            $attrs['gps_altitude'][] = $frame->gpsAltitude;
            $attrs['yaw'][] = $frame->yaw;
        }

        // Remove all items that are full of null.
        $data = array_filter($data, fn ($item) => !empty(array_filter($item, fn ($i) => !is_null($i))));

        // Remove all items that are full of null.
        $attrs = array_filter($attrs, fn ($item) => !empty(array_filter($item, fn ($i) => !is_null($i))));

        $data['filename'] = $this->name;

        if (!empty($attrs)) {
            $data['attrs'] = ['metadata' => $attrs];
        }

        return $data;
    }
}
