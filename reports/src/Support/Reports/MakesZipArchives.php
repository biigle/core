<?php

namespace Biigle\Modules\Reports\Support\Reports;

use App;
use Exception;
use Illuminate\Support\Str;
use ZipArchive;

trait MakesZipArchives
{
    /**
     * Create a ZIP archive as a report.
     *
     * This function will create a ZIP archive at `$this->availableReport->path`.
     *
     * @param array $files Array of files, with source path as keys and target filenames (in the ZIP) as values.
     * @param string $path Path to the file to store the generated ZIP to
     *
     * @throws Exception If the ZIP file could not be created.
     */
    protected function makeZip($files, $path)
    {
        $zip = App::make(ZipArchive::class);
        $open = $zip->open($path, ZipArchive::OVERWRITE);

        if ($open !== true) {
            throw new Exception("Could not open ZIP file '{$path}'.");
        }

        try {
            foreach ($files as $source => $target) {
                $zip->addFile($source, $target);
            }
        } finally {
            $zip->close();
        }
    }

    /**
     * Sanitizes a filename.
     *
     * @param string $name Filename to sanitize
     * @param string $extension File extension to use (since dots are sanitized, too)
     *
     * @return string
     */
    protected function sanitizeFilename($name, $extension)
    {
        return Str::slug($name).'.'.$extension;
    }
}
