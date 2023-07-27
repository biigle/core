<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class Utf8 implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        $value = is_string($value) ? $value : $value->get();
        return mb_detect_encoding($value, 'UTF-8', true) !== false;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "The :attribute must be UTF-8 encoded.";
    }
}
