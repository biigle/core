<?php

namespace Dias\Modules\Export\Support\Reports;

use App;
use Exception;
use ZipArchive;
use Illuminate\Support\Str;

trait MakesZipArchives
{
    /**
     * Create a ZIP archive as a report.
     *
     * This function will create a ZIP archive at `$this->availableReport->path` and put the CSV files of `$this->tmpFiles`, indexed by the transect IDs, into it.
     *
     * @param array $transects Array of transects, with transect IDs as keys and transect names as values.
     * @throws Exception If the ZIP file could not be created.
     */
    protected function makeZip($transects)
    {
        $zip = App::make(ZipArchive::class);
        $open = $zip->open($this->availableReport->path, ZipArchive::CREATE);

        if ($open !== true) {
            throw new Exception("Could not open ZIP file '{$this->availableReport->path}'.");
        }

        try {
            foreach ($transects as $id => $name) {
                $zip->addFile(
                    $this->tmpFiles[$id]->path,
                    $id.'_'.Str::slug($name).'.csv'
                );
            }
        } finally {
            $zip->close();
        }
    }
}
