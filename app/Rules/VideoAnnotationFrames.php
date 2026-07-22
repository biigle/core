<?php

namespace Biigle\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VideoAnnotationFrames implements ValidationRule
{
    /**
     * @param float $duration Duration of the video in seconds.
     */
    public function __construct(protected float $duration)
    {
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param string $attribute
     * @param mixed $value
     * @param Closure $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_array($value)) {
            $fail("The {$attribute} must be an array.");

            return;
        }

        if (!array_is_list($value)) {
            $fail("The {$attribute} must be a list.");

            return;
        }

        $lastIndex = count($value) - 1;

        foreach ($value as $index => $frame) {
            if (is_null($frame)) {
                // null represents a gap in the annotation and is allowed, but not as
                // the first or last frame.
                if ($index === 0 || $index === $lastIndex) {
                    $fail("The {$attribute} must not start or end with a gap.");

                    return;
                }

                continue;
            }

            // Numeric strings are rejected like in VideoAnnotationPoints, so the frames
            // are always stored with a consistent type.
            if ((!is_int($frame) && !is_float($frame)) || $frame < 0 || $frame > $this->duration) {
                $fail("The {$attribute} must contain only numbers between 0 and {$this->duration}.");

                return;
            }
        }
    }
}
