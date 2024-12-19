<?php

namespace Biigle\Services\Export;

use DB;
use File;
use SplFileObject;

class VideoLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_video_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'video_id',
            'label_id',
            'user_id',
            'created_at',
            'updated_at',
        ]);

        DB::table('video_labels')
            ->join('videos', 'videos.id', '=', 'video_labels.video_id')
            ->whereIn('videos.volume_id', $this->ids)
            ->select([
                'video_labels.id as video_label_id',
                'video_labels.video_id',
                'video_labels.label_id',
                'video_labels.user_id',
                'video_labels.created_at',
                'video_labels.updated_at',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->video_id,
                    $row->label_id,
                    $row->user_id,
                    $row->created_at,
                    $row->updated_at,
                ]);
            }, 100000, 'video_labels.id', 'video_label_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'video_labels.csv';
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
