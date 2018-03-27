<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class AnnotationLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_annotation_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');

        DB::table('annotation_labels')
            ->join('annotations', 'annotations.id', '=', 'annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'annotations.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select([
                'annotation_labels.id as annotation_label_id',
                'annotation_labels.annotation_id',
                'annotation_labels.label_id',
                'annotation_labels.user_id',
                'annotation_labels.confidence',
                'annotation_labels.created_at',
                'annotation_labels.updated_at'
            ])
            ->chunkById(1E+5, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->fputcsv([
                        $row->annotation_id,
                        $row->label_id,
                        $row->user_id,
                        $row->confidence,
                        $row->created_at,
                        $row->updated_at,
                    ]);
                }
            }, 'annotation_labels.id', 'annotation_label_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'annotation_labels.csv';
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
