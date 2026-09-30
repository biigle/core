<?php

namespace Biigle\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VideoAnnotationGaps implements ValidationRule
{
    /**
     * Key frame times of the annotation, one for each entry of the points array. May
     * contain null values to represent gaps in the annotation.
     */
    protected array $frames;

    /**
     * Create a new instance.
     *
     * @param array $frames Key frame times of the annotation.
     */
    public function __construct(array $frames)
    {
        $this->frames = $frames;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
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
     * The points must already be validated with VideoAnnotationPoints and the frames
     * with VideoAnnotationFrames because this expects a well-formed array of arrays.
     *
     * @param array $points Points array like `[[x1, y1, ...], [], [x1, y1, ...]]` with
     * one entry for each key frame. An empty entry represents a gap.
     * @return string|null The error message or null if the gaps are consistent.
     */
    public function getErrorMessage(array $points): ?string
    {
        // The frames are matched by index below, so an array with other keys would
        // produce a misleading error message.
        if (!array_is_list($this->frames)) {
            return 'The annotation frames must be a list.';
        }

        if (count($points) !== count($this->frames)) {
            return 'The number of key frames does not match the number of annotation coordinates.';
        }

        // Gaps are represented as empty arrays. This also catches the all-empty case.
        if (empty($points[0]) || empty(end($points))) {
            return 'An annotation must not start or end with a gap.';
        }

        foreach ($points as $index => $point) {
            if (empty($point) !== is_null($this->frames[$index])) {
                return 'A gap must have empty points and no key frame time.';
            }
        }

        return null;
    }
}
