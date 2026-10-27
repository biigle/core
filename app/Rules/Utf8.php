<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class Utf8 implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * Strings with invalid UTF-8 byte sequences can't be stored in the database. This
     * only happens with manipulated requests, e.g. from bots, but would otherwise
     * produce a server error.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        return !is_string($value) || mb_check_encoding($value, 'UTF-8');
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The :attribute contains invalid characters.';
    }
}
