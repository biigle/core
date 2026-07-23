<?php

namespace Biigle\Services;

/**
 * Checks for the points and frames of video annotations.
 *
 * The checks are implemented here because they are used by the form requests as well as
 * by the annotation models and both must agree. Else the validation of a request could
 * let values through that fail later with an unhandled error.
 *
 * Each method returns an error message if the check failed and null if it passed.
 */
class VideoAnnotationValidation
{
    /**
     * Check the structure of an annotation points array.
     *
     * @param mixed $points
     */
    public static function checkPoints(mixed $points): ?string
    {
        if (!is_array($points)) {
            return 'The annotation points must be an array.';
        }

        if (!array_is_list($points)) {
            return 'The annotation points must be a list.';
        }

        foreach ($points as $point) {
            // Numeric strings are rejected because HasPointsAttribute requires int or
            // float, too.
            if (!is_array($point) || !array_is_list($point) || array_filter($point, fn ($v) => !is_int($v) && !is_float($v))) {
                return 'The annotation points must be an array of arrays of numbers.';
            }
        }

        return null;
    }

    /**
     * Check the structure and values of an annotation frames array.
     *
     * @param mixed $frames
     * @param float $duration Duration of the video in seconds.
     */
    public static function checkFrames(mixed $frames, float $duration): ?string
    {
        if (!is_array($frames)) {
            return 'The annotation frames must be an array.';
        }

        if (!array_is_list($frames)) {
            return 'The annotation frames must be a list.';
        }

        $lastIndex = count($frames) - 1;

        foreach ($frames as $index => $frame) {
            if (is_null($frame)) {
                // null represents a gap in the annotation and is allowed, but not as
                // the first or last frame.
                if ($index === 0 || $index === $lastIndex) {
                    return 'The annotation frames must not start or end with a gap.';
                }

                continue;
            }

            // Numeric strings are rejected like in checkPoints(), so the frames are
            // always stored with a consistent type.
            if ((!is_int($frame) && !is_float($frame)) || $frame < 0 || $frame > $duration) {
                return "The annotation frames must contain only numbers between 0 and {$duration}.";
            }
        }

        return null;
    }

    /**
     * Check that the gaps of a points array match the gaps of a frames array.
     *
     * Gaps are represented as empty points arrays and null frames.
     *
     * The points must be checked with checkPoints() first because this expects an array
     * of arrays.
     *
     * @param array<mixed> $points
     * @param array<mixed> $frames
     */
    public static function checkGaps(array $points, array $frames): ?string
    {
        if (count($points) !== count($frames)) {
            return 'The number of key frames does not match the number of annotation coordinates.';
        }

        // Gaps are represented as empty arrays. This also catches the all-empty case.
        if (empty($points[0]) || empty(end($points))) {
            return 'An annotation must not start or end with a gap.';
        }

        foreach ($points as $index => $point) {
            if (empty($point) !== is_null($frames[$index])) {
                return 'A gap must have empty points and no key frame time.';
            }
        }

        return null;
    }
}
