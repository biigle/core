<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class Utf8 implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $file
     * @return bool
     */
    public function passes($attribute, $file)
    {
        return mb_detect_encoding($file->get(), 'UTF-8', true) !== false;
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
