<?php

namespace Biigle\Traits;

trait HasPointsAttribute
{
    /**
     * Round the floats of the points array to 2 decimals before saving.
     *
     * This is a more than sufficient precision for annotation point coordinates and
     * saves memory in the DB as well as when processing the annotations in PHP.
     *
     * @param array $points
     */
    public function setPointsAttribute(array $points)
    {
        $points = array_map(fn ($coordinate) => round($coordinate, 2), $points);

        $this->attributes['points'] = json_encode($points);
    }
}
