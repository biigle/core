<?php

namespace Biigle\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class VideoAnnotationPoints implements ValidationRule
{
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

        foreach ($value as $point) {
            // Numeric strings are rejected because VideoAnnotation::validatePoints()
            // requires int or float, too. Both checks must agree, else this rule would
            // let values through that fail later with an unhandled error.
            if (!is_array($point) || array_filter($point, fn ($v) => !is_int($v) && !is_float($v))) {
                $fail("The {$attribute} must be an array of arrays of numbers.");

                return;
            }
        }
    }
}
