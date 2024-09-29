<?php

namespace Biigle\Services\MetadataParsing;

use Carbon\Carbon;

class ImageMetadata extends FileMetadata
{
    /**
     * Determines if any metadata field other than the name is filled.
     */
    public function isEmpty(): bool
    {
        return !$this->hasAnnotations()
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
        $data = ['filename' => $this->name];

        if (!is_null($this->lat)) {
            $data['lat'] = $this->lat;
        }

        if (!is_null($this->lng)) {
            $data['lng'] = $this->lng;
        }

        if (!is_null($this->takenAt)) {
            $data['taken_at'] = Carbon::parse($this->takenAt)->toDateTimeString();
        }

        $attrs = [];

        if (!is_null($this->area)) {
            $attrs['area'] = $this->area;
        }

        if (!is_null($this->distanceToGround)) {
            $attrs['distance_to_ground'] = $this->distanceToGround;
        }

        if (!is_null($this->gpsAltitude)) {
            $attrs['gps_altitude'] = $this->gpsAltitude;
        }

        if (!is_null($this->yaw)) {
            $attrs['yaw'] = $this->yaw;
        }

        if (!empty($attrs)) {
            $data['attrs'] = ['metadata' => $attrs];
        }

        return $data;
    }
}
