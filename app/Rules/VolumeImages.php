<?php

namespace Biigle\Rules;

use Biigle\Volume;
use Illuminate\Contracts\Validation\Rule;

class VolumeImages implements Rule
{
    /**
     * The validation message to display.
     *
     * @var string
     */
    protected $message;

    /**
     * Create a new instance.
     */
    public function __construct()
    {
        $this->message = 'The volume images are invalid.';
    }

    /**
     * Check if an array of image filenames is valid.
     *
     * A valid array is not empty, contains no duplicates and has only images with JPG,
     * PNG or GIF file endings.
     *
     * @param  string  $attribute
     * @param  array  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (empty($value)) {
            $this->message = 'No images were supplied.';

            return false;
        }

        $count = count($value);

        if ($count !== count(array_unique($value))) {
            $this->message = 'A volume must not have the same image twice.';

            return false;
        }

        if ($count !== count(preg_grep(Volume::FILE_REGEX, $value))) {
            $this->message = 'Only JPEG, PNG or TIFF image formats are supported.';

            return false;
        }

        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return $this->message;
    }
}
