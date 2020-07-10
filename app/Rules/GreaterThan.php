<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class GreaterThan implements Rule
{
    /**
     * The value to compare.
     *
     * @var mixed
     */
    protected $compare;

    /**
     * Create a new instance.
     */
    public function __construct($compare)
    {
        $this->compare = $compare;
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        return $value > $this->compare;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "The :attribute must be greater than {$this->compare}.";
    }
}
