<?php

namespace Biigle\Services\Reports;

use App;
use File as FS;

class File
{
    /**
     * File path.
     *
     * @var string
     */
    protected $path;

    /**
     * File handle.
     *
     * @var resource
     */
    protected $handle;

    /**
     * Creates a new temporary file.
     *
     * @return CsvFile
     */
    public static function makeTmp()
    {
        return App::make(static::class);
    }

    /**
     * Create a new file.
     *
     * @param string $path File path. If not set, a temporary file will be created.
     */
    public function __construct($path = null)
    {
        if (is_null($path)) {
            $this->path = tempnam(config('reports.tmp_storage'), 'biigle-report-');
        } else {
            $this->path = $path;
        }

        $this->handle = fopen($this->path, 'w');
    }

    public function __destruct()
    {
        $this->close();
    }

    /**
     * Delete the file.
     */
    public function delete()
    {
        $this->close();
        FS::delete($this->path);
    }

    /**
     * Close the file.
     */
    public function close()
    {
        try {
            if (is_resource($this->handle)) {
                fclose($this->handle);
            }
        } catch (\Exception $e) {
            //
        }
    }

    /**
     * Returns the path to the file.
     *
     * @return string
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * Add content to the file.
     */
    public function put(string $content): int
    {
        return fwrite($this->handle, $content."\n");
    }
}
