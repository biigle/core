<?php

namespace Biigle\Rules;

use Biigle\Volume;
use Illuminate\Contracts\Validation\Rule;

class VolumeFileUnique implements Rule
{
    /**
     * The filenames that already exist.
     *
     * @var \Illuminate\Support\Collection
     */
    protected $files;

    /**
     * The volume to check for existing files.
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
     * Check if the given filenames don't already exist in the volume.
     *
     * @param  string  $attribute
     * @param  array  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        $this->files = $this->volume->files()
            ->whereIn('filename', $value)
            ->pluck('filename');

        return $this->files->isEmpty();
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return "The files already exist: {$this->files->implode(', ')}";
    }
}
