<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class ImageExport extends Export
{
    /**
     * Path to the temporary CSV file.
     *
     * @var string
     */
    protected $tmpPath;

    /**
     * {@inheritdoc}
     */
    public function getContent()
    {
        if (!$this->tmpPath) {
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_image_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');

        DB::table('images')
            ->whereIn('volume_id', $this->ids)
            ->select([
                'id',
                'filename',
                'volume_id',
            ])
            ->chunkById(1E+5, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->fputcsv([
                        $row->id,
                        $row->filename,
                        $row->volume_id,
                    ]);
                }
            });

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'images.csv';
    }

    /**
     * {@inheritdoc}
     */
    protected function cleanUp()
    {
        if ($this->tmpPath) {
            File::delete($this->tmpPath);
        }
    }
}
