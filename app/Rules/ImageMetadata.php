<?php

namespace Biigle\Rules;

use Illuminate\Contracts\Validation\Rule;

class ImageMetadata implements Rule
{
    /**
     * Array of volume file names.
     *
     * @var array
     */
    protected $files;

    /**
     * Create a new instance.
     *
     * @param array $files
     */
    public function __construct($files)
    {
        $this->files = $files;
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
        // TODO
        return false;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        // TODO
        return "The :attribute must be less than {$this->compare}.";
    }
}
