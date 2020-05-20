<?php

namespace Biigle\Rules;

use Biigle\Volume;
use Illuminate\Contracts\Validation\Rule;

class VolumeImageUnique implements Rule
{
    /**
     * The filenames of the images that already exist.
     *
     * @var Collection
     */
    protected $images;

    /**
     * The volume to check for existing images.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Create a new instance.
     *
     * @param Volume $volume
     */
    public function __construct(Volume $volume)
    {
        $this->volume = $volume;
    }

    /**
     * Check if the given image filenames don't already exist in the volume.
     *
     * @param  string  $attribute
     * @param  array  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        $this->images = $this->volume->images()
            ->whereIn('filename', $value)
            ->pluck('filename');

        return $this->images->isEmpty();
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "The images already exist: {$this->images->implode(', ')}";
    }
}
