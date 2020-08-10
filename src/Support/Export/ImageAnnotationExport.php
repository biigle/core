<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class ImageAnnotationExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_image_annotation_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'id',
            'image_id',
            'shape_id',
            'created_at',
            'updated_at',
            'points',
        ]);

        DB::table('image_annotations')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select([
                'image_annotations.id as annotation_id',
                'image_annotations.image_id',
                'image_annotations.shape_id',
                'image_annotations.created_at',
                'image_annotations.updated_at',
                'image_annotations.points',
            ])
            // The chunk size is lower than for the ImageAnnotationLabelExport and the
            // ImageExport because annotations can have a variable (and possibly large)
            // number of points!
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->annotation_id,
                    $row->image_id,
                    $row->shape_id,
                    $row->created_at,
                    $row->updated_at,
                    $row->points,
                ]);
            }, 5E+4, 'image_annotations.id', 'annotation_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'image_annotations.csv';
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
