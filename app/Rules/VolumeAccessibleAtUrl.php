<?php

namespace Biigle\Rules;

use Biigle\FileCache\GenericFile;
use Biigle\Volume;
use Exception;
use FileCache;
use Illuminate\Contracts\Validation\Rule;

/**
 * Validates that a sample of an existing volume's files is reachable
 * at a candidate replacement URL. Mirrors the per-file existence check
 * applied at volume creation time (see Biigle\Rules\VolumeFiles), so
 * an admin can't silently re-point a volume at a URL where the files
 * don't actually live.
 *
 * The rule's $value is the candidate URL string; the volume and the
 * sample size come in via the constructor.
 */
class VolumeAccessibleAtUrl implements Rule
{
    /**
     * The validation message to display.
     *
     * @var string
     */
    protected $message;

    /**
     * The volume whose existing files should be probed at the candidate URL.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Number of sample files to probe.
     *
     * @var int
     */
    protected $sampleCount;

    /**
     * @param Volume $volume Volume whose files should be probed.
     * @param int $sampleCount How many existing files to probe at the new URL.
     */
    public function __construct(Volume $volume, int $sampleCount = 5)
    {
        $this->message = 'The volume files are not accessible at this URL.';
        $this->volume = $volume;
        $this->sampleCount = $sampleCount;
    }

    /**
     * @param string $attribute
     * @param mixed $value Candidate volume URL.
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (!is_string($value)) {
            return false;
        }

        // Match VolumeFiles' URL-normalisation: strip a single trailing
        // slash, but leave bare-scheme URLs (`local://`) alone so we
        // don't turn them into `local:/`.
        if (str_ends_with($value, '://')) {
            $url = $value;
        } else {
            $url = rtrim($value, '/');
        }

        $filenames = $this->volume->files()
            ->inRandomOrder()
            ->limit($this->sampleCount)
            ->pluck('filename');

        // No files to probe yet — let the URL change through. The
        // ProcessNewVolumeFiles job will populate the volume from the
        // new URL and surface any file-level problems then.
        if ($filenames->isEmpty()) {
            return true;
        }

        try {
            foreach ($filenames as $filename) {
                if (!FileCache::exists(new GenericFile("{$url}/{$filename}"))) {
                    $this->message = "Some files could not be accessed at the new URL ({$filename}). Please make sure all files exist before changing the URL.";

                    return false;
                }
            }
        } catch (Exception $e) {
            $this->message = "Some files could not be accessed at the new URL. {$e->getMessage()}";

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
