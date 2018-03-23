<?php

namespace Biigle\Modules\Sync\Support\Export;

use ZipArchive;

class Export
{
    /**
     * Generate the export archive file and return the temporary file path.
     *
     * @return string
     */
    public function getArchive()
    {
        $content = json_encode($this->getContent());
        $path = tempnam(config('sync.tmp_storage'), 'biigle_export');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE);
        $zip->addFromString($this->getFileName(), $content);

        return $path;
    }

    /**
     * Get the content of the export file.
     *
     * @return array
     */
    public function getContent()
    {
        return [];
    }

    /**
     * Get the name of the export file.
     *
     * @return string
     */
    public function getFileName()
    {
        return 'data.json';
    }
}
