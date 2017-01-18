<?php

namespace Biigle\Modules\Export;

use File;
use Biigle\Modules\Export\Contracts\DeletableContract;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Represents the file of a generated report.
 */
class AvailableReport implements DeletableContract
{
    /**
     * The file path of this report.
     *
     * @var string
     */
    public $path;

    public static function findOrFail($uid)
    {
        $report = new static($uid);

        if (!$report->exists()) {
            throw (new ModelNotFoundException)->setModel(static::class);
        }

        return $report;
    }

    /**
     * Create a new report object.
     *
     * @param string $basename Optional basename of an existing report file. If not specified, a new one will be generated.
     */
    public function __construct($basename = null)
    {
        if ($basename) {
            $this->path = config('export.reports_storage').'/'.$basename;
        } else {
            do {
                // use str_random to generate a cryptographically secure random string
                // because it will be used to retrieve the file via a public url
                $path = config('export.reports_storage').'/'.str_random();
            } while (File::exists($path));

            $this->path = $path;
        }
    }

    /**
     * Return the basename of the file of this report.
     *
     * @return string
     */
    public function basename()
    {
        return File::basename($this->path);
    }

    /**
     * Return the dirname of the file of this report.
     *
     * @return string
     */
    public function dirname()
    {
        return File::dirname($this->path);
    }

    /**
     * Delete the report file.
     */
    public function delete()
    {
        return File::delete($this->path);
    }

    /**
     * Check if the report exists.
     *
     * @return bool
     */
    public function exists()
    {
        return File::exists($this->path);
    }
}
