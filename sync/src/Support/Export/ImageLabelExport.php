<?php

namespace Biigle\Modules\Sync\Support\Export;

use DB;
use File;
use SplFileObject;

class ImageLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_image_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $csv->fputcsv([
            'image_id',
            'label_id',
            'user_id',
            'created_at',
            'updated_at',
        ]);

        DB::table('image_labels')
            ->join('images', 'images.id', '=', 'image_labels.image_id')
            ->whereIn('images.volume_id', $this->ids)
            ->select([
                'image_labels.id as image_label_id',
                'image_labels.image_id',
                'image_labels.label_id',
                'image_labels.user_id',
                'image_labels.created_at',
                'image_labels.updated_at',
            ])
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->image_id,
                    $row->label_id,
                    $row->user_id,
                    $row->created_at,
                    $row->updated_at,
                ]);
            }, 1E+5, 'image_labels.id', 'image_label_id');

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'image_labels.csv';
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
