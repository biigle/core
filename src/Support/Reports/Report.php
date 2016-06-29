<?php

namespace Dias\Modules\Export\Support\Reports;

use File;

class Report
{
    /**
     * The file path of this report
     *
     * @var string
     */
    public $path;

    /**
     * Create a new report object
     */
    public function __construct()
    {
        do {
            // use str_random to generate a cryptographically secure random string
            // because it will be used to retrieve the file via a public url
            $path = config('export.reports_storage').'/'.str_random();
        } while (File::exists($path));

        $this->path = $path;
    }

    /**
     * Return the basename of the file of this repost
     *
     * @return string
     */
    public function basename()
    {
        return File::basename($this->path);
    }

    /**
     * Return the dirname of the file of this repost
     *
     * @return string
     */
    public function dirname()
    {
        return File::dirname($this->path);
    }

}
