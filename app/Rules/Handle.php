<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class Handle implements Rule
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
        return str_contains($value, '/') && !str_contains($value, '//');
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "The :attribute must be a valid handle or DOI.";
    }
}
