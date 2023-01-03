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
     * Maximum lengths of a volume filename.
     *
     * @var int
     */
    const FILENAME_MAX_LENGTH = 255;

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
            $dupes = array_keys(array_filter(array_count_values($value), function ($v) {
                return $v > 1;
            }));


            $this->message = 'A volume must not have the same file twice. Duplicate files: '.implode(', ', $dupes);

            return false;
        }

        $lengths = array_map('strlen', $value);
        $tooLong = array_filter($lengths, function ($l) {
            return $l > self::FILENAME_MAX_LENGTH;
        });

        if (!empty($tooLong)) {
            $this->message = 'A filename must not be longer than '.self::FILENAME_MAX_LENGTH.' characters.';

            return false;
        }

        if ($this->typeId === MediaType::imageId()) {
            if ($count !== count(preg_grep(Volume::IMAGE_FILE_REGEX, $value))) {
                $this->message = 'Only JPEG, PNG, WebP or TIFF image formats are supported.';

                return false;
            }
        } elseif ($this->typeId === MediaType::videoId()) {
            if ($count !== count(preg_grep(Volume::VIDEO_FILE_REGEX, $value))) {
                $this->message = 'Only MPEG, MP4 or WebM video formats are supported.';

                return false;
            }
        }

        try {
            $successOrFile = $this->sampleFilesExist($value);
            if ($successOrFile !== true) {
                $this->message = "Some files could not be accessed ({$successOrFile}). Please make sure all files exist.";

                return false;
            }
        } catch (Exception $e) {
            $this->message = "Some files could not be accessed. {$e->getMessage()}";

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
     * @return string|bool
     */
    protected function sampleFilesExist($files)
    {
        $samples = collect($files)
            ->shuffle()
            ->take($this->sampleCount);

        foreach ($samples as $filename) {
            if (!FileCache::exists(new GenericFile("{$this->url}/{$filename}"))) {
                return $filename;
            }
        }

        return true;
    }
}
