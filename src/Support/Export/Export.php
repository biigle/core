<?php

namespace Biigle\Modules\Sync\Support\Export;

use ZipArchive;

class Export
{
    /**
     * IDs of the models of this export.
     *
     * @var array
     */
    protected $ids;

    /**
     * Create a new instance.
     *
     * @param array $ids Model IDs
     */
    public function __construct(array $ids)
    {
        $this->ids = $ids;
    }

    /**
     * Generate the export archive file and return the temporary file path.
     *
     * @return string
     */
    public function getArchive()
    {
        $path = tempnam(config('sync.tmp_storage'), 'biigle_export');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $exports = $this->getAdditionalExports();
        array_unshift($exports, $this);

        try {
            foreach ($exports as $export) {
                $export->addToZip($zip);
            }

            $zip->close();
        } finally {
            foreach ($exports as $export) {
                $export->cleanUp();
            }
        }

        return $path;
    }

    /**
     * Get the content of the export file. If a string, it is the path to the temporary
     * file containing the content (like a CSV).
     *
     * @return array|string
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

    /**
     * Get additional exports that should be included in the export archive.
     *
     * @return array
     */
    public function getAdditionalExports()
    {
        return [];
    }

    /**
     * Add more model IDs to this export.
     *
     * @param array $ids
     */
    public function addIds(array $ids)
    {
        $this->ids = array_unique(array_merge($this->ids, $ids));
    }

    /**
     * Add the file of this report to a zip.
     *
     * @param ZipArchive $zip
     */
    protected function addToZip(ZipArchive $zip)
    {
        $content = $this->getContent();
        if (is_array($content)) {
            $zip->addFromString($this->getFileName(), json_encode($content, JSON_UNESCAPED_SLASHES));
        } else {
            $zip->addFile($content, $this->getFileName());
        }
    }

    /**
     * Clean up any temporary files.
     */
    protected function cleanUp()
    {
        //
    }
}
