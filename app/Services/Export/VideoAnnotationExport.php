<?php

namespace Biigle\Services\Export;

use DB;
use File;
use SplFileObject;

class VideoAnnotationExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_video_annotation_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'id',
            'video_id',
            'shape_id',
            'created_at',
            'updated_at',
            'points',
            'frames',
        ]);

        DB::table('video_annotations')
            ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->whereIn('videos.volume_id', $this->ids)
            ->select([
                'video_annotations.id as annotation_id',
                'video_annotations.video_id',
                'video_annotations.shape_id',
                'video_annotations.created_at',
                'video_annotations.updated_at',
                'video_annotations.points',
                'video_annotations.frames',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->annotation_id,
                    $row->video_id,
                    $row->shape_id,
                    $row->created_at,
                    $row->updated_at,
                    $row->points,
                    $row->frames,
                ]);
            }, 2000, 'video_annotations.id', 'annotation_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'video_annotations.csv';
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
