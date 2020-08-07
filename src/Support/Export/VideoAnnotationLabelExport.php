<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class VideoAnnotationLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_video_annotation_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'annotation_id',
            'label_id',
            'user_id',
            'created_at',
            'updated_at',
        ]);

        DB::table('video_annotation_labels')
            ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->whereIn('videos.volume_id', $this->ids)
            ->select([
                'video_annotation_labels.id as annotation_label_id',
                'video_annotation_labels.annotation_id',
                'video_annotation_labels.label_id',
                'video_annotation_labels.user_id',
                'video_annotation_labels.created_at',
                'video_annotation_labels.updated_at',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->annotation_id,
                    $row->label_id,
                    $row->user_id,
                    $row->created_at,
                    $row->updated_at,
                ]);
            }, 1E+5, 'video_annotation_labels.id', 'annotation_label_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'video_annotation_labels.csv';
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
