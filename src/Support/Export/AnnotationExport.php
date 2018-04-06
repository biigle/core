<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class AnnotationExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_annotation_export');
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

        DB::table('annotations')
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select([
                'annotations.id as annotation_id',
                'annotations.image_id',
                'annotations.shape_id',
                'annotations.created_at',
                'annotations.updated_at',
                'annotations.points',
            ])
            // The chunk size is lower than for the AnnotationLabelExport and the
            // ImageExport because annotations can have a variable (and possibly large)
            // number of points!
            ->chunkById(5E+4, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->fputcsv([
                        $row->annotation_id,
                        $row->image_id,
                        $row->shape_id,
                        $row->created_at,
                        $row->updated_at,
                        $row->points,
                    ]);
                }
            }, 'annotations.id', 'annotation_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'annotations.csv';
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
