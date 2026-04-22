<?php

namespace Biigle\Traits;

use Biigle\Shape;
use Exception;

class InvalidCoordinateTypeException extends Exception
{
};
class InvalidNumberOfCoordinatesException extends Exception
{
};
class InvalidNumberOfPointsException extends Exception
{
};
class InvalidShapeException extends Exception
{
};

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
        $this->validateCoordinatesAreNumeric($points);
        $this->validateNumberOfCoordinates($points);
        $this->validateNumberOfPoints($points);
        $this->validateShape($points);
    }
    
    private function validateCoordinatesAreNumeric($points)
    {
        $invalidCoordinates = array_values(array_filter(
            $points,
            fn ($coordinate) => !is_int($coordinate) && !is_float($coordinate)
        ));

        if (!empty($invalidCoordinates)) {
            throw new InvalidCoordinateTypeException('Invalid coordinate type: The following coordinates aren\'t int or float: '.implode(', ', $invalidCoordinates).'');
        }
    }
    
    private function validateNumberOfCoordinates($points)
    {
        $size = count($points);
        
        switch ($this->shape_id) {
            case Shape::circleId():
                if ($size !== 3) {
                    throw new InvalidNumberOfCoordinatesException('Invalid number of values for shape circle: Expected 3, got '.$size.'.');
                }
                break;
            default:
                if ($size % 2 !== 0) {
                    throw new InvalidNumberOfCoordinatesException('Even number of coordinates expected but got '.$size.' coordinates instead. Note that each pair of coordinates is interpreted as a point.');
                }
                
                if ($size == 0) {
                    throw new InvalidNumberOfCoordinatesException('No coordinates were passed.');
                }
        }
    }
    
    private function validateNumberOfPoints($points)
    {
        $pointCount = intval(count($points) / 2);
        
        switch ($this->shape_id) {
            case Shape::pointId():
                if ($pointCount !== 1) {
                    throw new InvalidNumberOfPointsException('Invalid number of points for shape point: Need exactly 1 point, but '.$pointCount.' were given.');
                }
                break;
            case Shape::circleId(): return;
            case Shape::rectangleId():
            case Shape::ellipseId():
                if ($pointCount !== 4) {
                    throw new InvalidNumberOfPointsException('Invalid number of points for shape rectangle or ellipse: Expected 4, got '.$pointCount.'');
                }
                break;
            case Shape::polygonId():
                if ($pointCount < 4) {
                    throw new InvalidNumberOfPointsException('Invalid number of points for shape polygon: At least 4 points are needed, but only '.$pointCount.' are present.');
                }
                break;
            case Shape::lineId():
                if ($pointCount < 2) {
                    throw new InvalidNumberOfPointsException('Invalid number of points for shape line: At least 2 points are needed, but only '.$pointCount.' are present.');
                }
                break;
        }
    }
    
    private function validateShape($points)
    {
        $distinctPointCount = $this->countDistinctPoints($points);
        
        switch ($this->shape_id) {
            case Shape::circleId():
                if ($points[2] <= 0) {
                    throw new InvalidShapeException('Invalid radius for circle: Must be > 0, but is '.$points[2].'');
                }
                break;
            case Shape::rectangleId():
            case Shape::ellipseId():
                if ($distinctPointCount !== 4) {
                    throw new InvalidShapeException('Invalid points for shape rectangle or ellipse: Not all 4 points are distinct.');
                }
                break;
            case Shape::polygonId():
                if ($distinctPointCount < 3) {
                    throw new InvalidShapeException('Invalid points for shape polygon: A polygon requires at least 3 distinct points, but only '.$distinctPointCount.' were given.');
                }
                
                if ($points[0] !== $points[count($points) - 2] || $points[1] !== $points[count($points) - 1]) {
                    throw new InvalidShapeException('Invalid points for shape polygon: The first and last coordinate of a polygon must be the same.');
                }
                break;
            case Shape::lineId():
                if ($distinctPointCount < 2) {
                    throw new InvalidShapeException('Invalid points for shape line: A line requires at least 2 distinct points, but only 1 was given.');
                }
                break;
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
    private function countDistinctPoints($points)
    {
        $points = collect($points);
        // Use values to reset index
        $x = $points->filter(fn ($x, $idx) => $idx % 2 === 0)->values();
        $y = $points->filter(fn ($x, $idx) => $idx % 2 === 1)->values();
        $coords = $x->zip($y)->unique();
        return count($coords);
    }
}
