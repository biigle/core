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
        $shapeName = $this->shape->name;

        // check if all elements are integer or float
        $valid = array_reduce($points, fn ($carry, $point) => $carry && (is_float($point) || is_int($point)), true);

        if (!$valid) {
            throw new Exception('Invalid points for shape '.$shapeName.'!');
        }

        $size = sizeof($points);

        switch ($this->shape_id) {
            case Shape::pointId():
                $this->validateExactPointCount($size, 2, $shapeName);
                break;
            case Shape::circleId():
                $this->validateExactPointCount($size, 3, $shapeName);
                $valid = intval(($points)[2]) !== 0;
                break;
            case Shape::ellipseId():
            case Shape::rectangleId():
                $this->validateExactPointCount($size, 8, $shapeName);
                $valid = $this->countDistinctCoordinates($points) === 4;
                break;
            case Shape::polygonId():
                if ($size < 8) {
                    throw new Exception('Too few points for shape '.$shapeName.'!');
                }

                if ($size % 2 !== 0) {
                    throw new Exception('Too many points for shape '.$shapeName.'!');
                }

                $valid = $this->countDistinctCoordinates($points) >= 3;
                break;
            case Shape::lineId():
                if ($size < 4) {
                    throw new Exception('Too few points for shape '.$shapeName.'!');
                }

                if ($size % 2 !== 0) {
                    throw new Exception('Too many points for shape '.$shapeName.'!');
                }

                $valid = $this->countDistinctCoordinates($points) >= 2;
                break;
            default:
                if ($size === 0) {
                    throw new Exception('Too few points for shape '.$shapeName.'!');
                }

                if ($size % 2 !== 0) {
                    throw new Exception('Too many points for shape '.$shapeName.'!');
                }

                $valid = true;
        }

        if (!$valid) {
            throw new Exception('Invalid points for shape '.$shapeName.'!');
        }

        if ($this->shape_id === Shape::polygonId()) {
            $length = count($points);
            if ($points[0] !== $points[$length - 2] || $points[1] !== $points[$length - 1]) {
                throw new Exception('Invalid points for shape '.$shapeName.'!');
            }
        }
    }

    /**
     * Validate an exact number of coordinates.
     *
     * @param int $size
     * @param int $expectedSize
     * @param string $shapeName
     */
    private function validateExactPointCount(int $size, int $expectedSize, string $shapeName): void
    {
        if ($size < $expectedSize) {
            throw new Exception('Too few points for shape '.$shapeName.'!');
        }

        if ($size > $expectedSize) {
            throw new Exception('Too many points for shape '.$shapeName.'!');
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
        $points = array_map(fn ($coordinate) => round($coordinate, 2), $points);

        $this->attributes['points'] = json_encode($points);
    }

    /**
     * Counts number of distinct points
     * @param array $points containing the coordinates
     * @return int number of distinct points
     * **/
    private function countDistinctCoordinates($points)
    {
        $points = collect($points);
        // Use values to reset index
        $x = $points->filter(fn ($x, $idx) => $idx % 2 === 0)->values();
        $y = $points->filter(fn ($x, $idx) => $idx % 2 === 1)->values();
        $coords = $x->zip($y)->unique();
        return count($coords);
    }
}
