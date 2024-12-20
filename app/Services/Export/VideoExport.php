<?php

namespace Biigle\Services\Export;

use DB;
use File;
use SplFileObject;

class VideoExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_video_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv(['id', 'filename', 'volume_id']);

        DB::table('videos')
            ->whereIn('volume_id', $this->ids)
            ->select([
                'id',
                'filename',
                'volume_id',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->id,
                    $row->filename,
                    $row->volume_id,
                ]);
            }, 100000);

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'videos.csv';
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
