<?php

namespace Biigle\Services\Reports;

use App;
use Exception;
use Illuminate\Support\Str;
use ZipArchive;

trait MakesZipArchives
{
    /**
     * Create a ZIP archive as a report.
     *
     * This function will create a ZIP archive at `$this->availableReport->path`. All
     * files are put in a directory with the same name as the downloaded ZIP file.
     * Otherwise some tools extract the files of an archive with a single file without
     * a directory, which makes the location of the extracted files unpredictable.
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

        $directory = $this->getZipDirectoryName();

        try {
            foreach ($files as $source => $target) {
                $zip->addFile($source, "{$directory}/{$target}");
            }
        } finally {
            $zip->close();
        }
    }

    /**
     * Get the name of the directory that contains all files of the ZIP archive.
     *
     * This is the filename of the downloaded report without extension.
     *
     * @return string
     */
    protected function getZipDirectoryName()
    {
        return "{$this->source->id}_{$this->getFilename()}";
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
