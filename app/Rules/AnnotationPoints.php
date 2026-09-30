<?php

namespace Biigle\Rules;

use Biigle\Shape;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AnnotationPoints implements ValidationRule
{
    /**
     * ID of the shape the points should be valid for.
     */
    protected ?int $shapeId;

    /**
     * Create a new instance.
     *
     * @param mixed $shapeId Shape ID. Anything that is not a number is treated as
     * unknown shape, in which case the points are not validated.
     */
    public function __construct(mixed $shapeId)
    {
        $this->shapeId = is_numeric($shapeId) ? intval($shapeId) : null;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // The type of the points attribute is validated by a separate rule.
        if (!is_array($value)) {
            return;
        }

        $message = $this->getErrorMessage($value);

        if (!is_null($message)) {
            $fail($message);
        }
    }

    /**
     * Get the validation error message for a points array.
     *
     * This can be used to apply the rule outside of a validator.
     *
     * @param array $points Points array like `[x1, y1, x2, y2, x3, y3, ...]`
     * @return string|null The error message or null if the points are valid.
     */
    public function getErrorMessage(array $points): ?string
    {
        // The shape ID is validated by a separate rule.
        if (is_null($this->shapeId)) {
            return null;
        }

        // The subsequent checks assume that the previous ones passed.
        return $this->validateCoordinatesAreNumeric($points)
            ?? $this->validateNumberOfCoordinates($points)
            ?? $this->validateNumberOfPoints($points)
            ?? $this->validateShape($points);
    }

    /**
     * Validate that all coordinates are either int or float.
     */
    protected function validateCoordinatesAreNumeric(array $points): ?string
    {
        foreach ($points as $coordinate) {
            if (!is_int($coordinate) && !is_float($coordinate)) {
                return 'Invalid coordinate type: Coordinates must be of type float or integer.';
            }
        }

        return null;
    }

    /**
     * Validate that the number of coordinates matches the required number for the given
     * shape.
     */
    protected function validateNumberOfCoordinates(array $points): ?string
    {
        $size = count($points);

        switch ($this->shapeId) {
            case Shape::circleId():
                if ($size !== 3) {
                    return 'Invalid number of values for shape circle: Expected 3, got '.$size.'.';
                }
                break;
            default:
                if ($size % 2 !== 0) {
                    return 'Even number of coordinates expected but got '.$size.' coordinates instead.';
                }

                if ($size === 0) {
                    return 'No coordinates were passed.';
                }
        }

        return null;
    }

    /**
     * Validate that the number of points (sequential coordinate pairs) matches the
     * expected number of points for the given shape.
     */
    protected function validateNumberOfPoints(array $points): ?string
    {
        $pointCount = intval(count($points) / 2);

        switch ($this->shapeId) {
            case Shape::pointId():
                if ($pointCount !== 1) {
                    return 'Invalid number of points for shape point: Need exactly 1 point, but '.$pointCount.' were given.';
                }
                break;
            case Shape::rectangleId():
            case Shape::ellipseId():
                if ($pointCount !== 4) {
                    return 'Invalid number of points for shape rectangle or ellipse: Expected 4, got '.$pointCount.'';
                }
                break;
            case Shape::polygonId():
                if ($pointCount < 4) {
                    return 'Invalid number of points for shape polygon: At least 4 points are needed, but only '.$pointCount.' are present.';
                }
                break;
            case Shape::lineId():
                if ($pointCount < 2) {
                    return 'Invalid number of points for shape line: At least 2 points are needed, but only '.$pointCount.' are present.';
                }
                break;
        }

        return null;
    }

    /**
     * Validate some edge cases where the given points don't create a valid shape.
     */
    protected function validateShape(array $points): ?string
    {
        $distinctPointCount = $this->countDistinctPoints($points);

        switch ($this->shapeId) {
            case Shape::circleId():
                if ($points[2] <= 0) {
                    return 'Invalid radius for circle: Must be > 0, but is '.$points[2].'';
                }
                break;
            case Shape::rectangleId():
            case Shape::ellipseId():
                if ($distinctPointCount !== 4) {
                    return 'Invalid points for shape rectangle or ellipse: Not all 4 points are distinct.';
                }
                break;
            case Shape::polygonId():
                if ($distinctPointCount < 3) {
                    return 'Invalid points for shape polygon: A polygon requires at least 3 distinct points, but only '.$distinctPointCount.' were given.';
                }

                if ($points[0] !== $points[count($points) - 2] || $points[1] !== $points[count($points) - 1]) {
                    return 'Invalid points for shape polygon: The first and last coordinate of a polygon must be the same.';
                }
                break;
            case Shape::lineId():
                if ($distinctPointCount < 2) {
                    return 'Invalid points for shape line: A line requires at least 2 distinct points, but only 1 was given.';
                }
                break;
        }

        return null;
    }

    /**
     * Count the number of distinct points.
     */
    protected function countDistinctPoints(array $points): int
    {
        $points = collect($points);
        // Use values to reset index
        $x = $points->filter(fn ($x, $idx) => $idx % 2 === 0)->values();
        $y = $points->filter(fn ($x, $idx) => $idx % 2 === 1)->values();
        $coords = $x->zip($y)->unique();

        return count($coords);
    }
}
