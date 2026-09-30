<?php

namespace Biigle\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VideoAnnotationFrames implements ValidationRule
{
    /**
     * Duration of the video in seconds. Frame times are not checked against the
     * duration if this is null (e.g. because the duration is not known yet).
     */
    protected ?float $duration;

    /**
     * Create a new instance.
     *
     * @param float|null $duration Duration of the video in seconds. Frame times are
     * not checked against the duration if this is null.
     */
    public function __construct(?float $duration = null)
    {
        $this->duration = $duration;
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
     * Get the validation error message for a frames array.
     *
     * This can be used to apply the rule outside of a validator.
     *
     * @param array $frames Key frame times, may contain null values to represent
     * gaps in the annotation.
     * @return string|null The error message or null if the frames are valid.
     */
    public function getErrorMessage(array $frames): ?string
    {
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

            // Numeric strings are rejected like in VideoAnnotationPoints, so the frames
            // are always stored with a consistent type.
            if (!is_int($frame) && !is_float($frame)) {
                return 'The annotation frames must contain only numbers.';
            }

            if ($frame < 0) {
                return 'The annotation frames must not contain negative numbers.';
            }

            // The upper bound can only be checked if the duration is known.
            if (!is_null($this->duration) && $frame > $this->duration) {
                return "The annotation frames must contain only numbers between 0 and {$this->duration}.";
            }
        }

        return null;
    }
}
