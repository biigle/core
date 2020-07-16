<?php

namespace Biigle\Rules;

use Biigle\FileCache\GenericFile;
use Biigle\MediaType;
use Biigle\Volume;
use Exception;
use FileCache;
use Illuminate\Contracts\Validation\Rule;

class VolumeFiles implements Rule
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
     * The media type ID.
     *
     * @var int
     */
    protected $typeId;

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
     * @param int $typeId Media type ID
     * @param int $sampleCount
     */
    public function __construct($url, $typeId, $sampleCount = 5)
    {
        $this->message = 'The volume images are invalid.';
        $this->url = $url;
        $this->typeId = $typeId;
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
            $this->message = 'No files were supplied.';

            return false;
        }

        $count = count($value);

        if ($count !== count(array_unique($value))) {
            $this->message = 'A volume must not have the same file twice.';

            return false;
        }

        if ($this->typeId === MediaType::imageId()) {
            if ($count !== count(preg_grep(Volume::IMAGE_FILE_REGEX, $value))) {
                $this->message = 'Only JPEG, PNG or TIFF image formats are supported.';

                return false;
            }
        } else {
            if ($count !== count(preg_grep(Volume::VIDEO_FILE_REGEX, $value))) {
                $this->message = 'Only MPEG, MP4 or WebM video formats are supported.';

                return false;
            }
        }

        if (!$this->sampleFilesExist($value)) {
            $this->message = 'Some files could not be accessed. Please make sure all files exist.';

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
     * Check a random sample of the files for existence.
     *
     * @param array $files
     *
     * @return bool
     */
    protected function sampleFilesExist($files)
    {
        $samples = collect($files)
            ->shuffle()
            ->take($this->sampleCount)
            ->map(function ($file) {
                return new GenericFile("{$this->url}/{$file}");
            });

        try {
            foreach ($samples as $file) {
                if (!FileCache::exists($file)) {
                    return false;
                }
            }
        } catch (Exception $e) {
            return false;
        }

        return true;
    }
}
