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
    function __construct(array $ids)
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
        $zip->open($path, ZipArchive::CREATE);
        $zip->addFromString($this->getFileName(), $this->getJson());

        foreach ($this->getAdditionalExports() as $export) {
            $zip->addFromString($export->getFileName(), $export->getJson());
        }

        return $path;
    }

    /**
     * Get the JSON encoded content of the export file.
     *
     * @return string
     */
    public function getJson()
    {
        return json_encode($this->getContent());
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
}
