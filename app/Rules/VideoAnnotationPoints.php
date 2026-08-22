<?php

namespace Biigle\Rules;

use Biigle\Shape;

class VideoAnnotationPoints extends AnnotationPoints
{
    /**
     * {@inheritdoc}
     *
     * @param array $points Points array like `[[x1, y1, x2, y2, ...], [], [x1, y1, ...]]`
     * with one entry for each key frame. An empty entry represents a gap.
     */
    public function getErrorMessage(array $points): ?string
    {
        if (is_null($this->shapeId)) {
            return null;
        }

        if ($this->shapeId === Shape::wholeFrameId()) {
            return count($points) === 0
                ? null
                : 'Whole frame annotations cannot have point coordinates.';
        }

        return $this->validatePointsStructure($points)
            ?? $this->validatePointsPerKeyFrame($points);
    }

    /**
     * Validate the structure of the points array.
     */
    protected function validatePointsStructure(array $points): ?string
    {
        if (!array_is_list($points)) {
            return 'The annotation points must be a list.';
        }

        foreach ($points as $point) {
            // Numeric strings are rejected because AnnotationPoints requires int or
            // float, too.
            if (!is_array($point) || !array_is_list($point) || array_filter($point, fn ($v) => !is_int($v) && !is_float($v))) {
                return 'The annotation points must be an array of arrays of numbers.';
            }
        }

        return null;
    }

    /**
     * Validate the shape-specific requirements of the points of each key frame.
     */
    protected function validatePointsPerKeyFrame(array $points): ?string
    {
        foreach ($points as $point) {
            // Gaps have no coordinates that could be validated.
            if (!empty($point)) {
                $message = parent::getErrorMessage($point);

                if (!is_null($message)) {
                    return $message;
                }
            }
        }

        return null;
    }
}
