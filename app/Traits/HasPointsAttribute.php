<?php

namespace Biigle\Traits;

use Biigle\Shape;
use Exception;

trait HasPointsAttribute
{
    /**
     * Validates a points array for the shape of this annotation.
     *
     * @param array $points Points array like `[x1, y1, x2, y2, x3, y3, ...]`
     * @throws Exception If the points array is invalid
     */
    public function validatePoints(array $points)
    {
        // check if all elements are integer
        $valid = array_reduce($points, function ($carry, $point) {
            return $carry && (is_float($point) || is_int($point));
        }, true);

        if (!$valid) {
            throw new Exception('Point coordinates must be of type float or integer.');
        }

        $size = sizeof($points);

        switch ($this->shape_id) {
            case Shape::pointId():
                $valid = $size === 2;
                break;
            case Shape::circleId():
                $valid = $size === 3;
                break;
            case Shape::ellipseId():
            case Shape::rectangleId():
                $valid = $size === 8;
                break;
            default:
                $valid = $size > 0 && $size % 2 === 0;
        }

        if (!$valid) {
            throw new Exception('Invalid number of points for shape '.$this->shape->name.'!');
        }

        if ($this->shape_id === Shape::polygonId()) {
            $length = count($points);
            if ($points[0] !== $points[$length - 2] || $points[1] !== $points[$length - 1]) {
                throw new Exception('The first and last coordinate of a polygon must be the same.');
            }
        }
    }

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
        $points = array_map(function ($coordinate) {
            return round($coordinate, 2);
        }, $points);

        $this->attributes['points'] = json_encode($points);
    }
}
