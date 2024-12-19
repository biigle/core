<?php

namespace Biigle\Services\Export;

use DB;
use File;
use SplFileObject;

class ImageAnnotationLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_image_annotation_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'annotation_id',
            'label_id',
            'user_id',
            'confidence',
            'created_at',
            'updated_at',
        ]);

        DB::table('image_annotation_labels')
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select([
                'image_annotation_labels.id as annotation_label_id',
                'image_annotation_labels.annotation_id',
                'image_annotation_labels.label_id',
                'image_annotation_labels.user_id',
                'image_annotation_labels.confidence',
                'image_annotation_labels.created_at',
                'image_annotation_labels.updated_at',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->annotation_id,
                    $row->label_id,
                    $row->user_id,
                    $row->confidence,
                    $row->created_at,
                    $row->updated_at,
                ]);
            }, 1E+5, 'image_annotation_labels.id', 'annotation_label_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'image_annotation_labels.csv';
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
