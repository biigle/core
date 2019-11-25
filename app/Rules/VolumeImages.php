<?php

namespace Biigle\Rules;

use FileCache;
use Exception;
use Biigle\Volume;
use Biigle\FileCache\GenericFile;
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
     * The volume URL to check the image files.
     *
     * @var string
     */
    protected $url;

    /**
     * Number of sample images to check for existence.
     *
     * @var int
     */
    protected $sampleCount;

    /**
     * Create a new instance.
     *
     * @param string $url
     * @param int $sampleCount
     */
    public function __construct($url, $sampleCount = 5)
    {
        $this->message = 'The volume images are invalid.';
        $this->url = $url;
        $this->sampleCount = $sampleCount;
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

        if (!$this->sampleImagesExist($value)) {
            $this->message = 'Some images could not be accessed. Please make sure all image files exist.';

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

    /**
     * Check a random sample of the image files for existence.
     *
     * @param array $images
     *
     * @return bool
     */
    protected function sampleImagesExist($images)
    {
        $samples = collect($images)
            ->shuffle()
            ->take($this->sampleCount)
            ->map(function ($file) {
                return new GenericFile("{$this->url}/{$file}");
            });

        try {
            FileCache::batchOnce($samples->toArray(), function ($files, $paths) {
                // Do nothing.
            });
        } catch (Exception $e) {
            return false;
        }

        return true;
    }
}
