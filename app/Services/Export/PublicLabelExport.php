<?php

namespace Biigle\Services\Export;

use Biigle\Label;
use File;
use SplFileObject;

class PublicLabelExport extends Export
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
            $this->tmpPath = tempnam(config('sync.tmp_storage'), 'biigle_public_label_export');
        }

        $csv = new SplFileObject($this->tmpPath, 'w');
        $columns = [
            'id',
            'name',
            'parent_id',
            'color',
            'label_tree_id',
            'source_id',
        ];
        $csv->fputcsv($columns);

        Label::where('label_tree_id', $this->ids[0])
            ->select($columns)
            ->eachById(function ($row) use ($csv) {
                $csv->fputcsv([
                    $row->id,
                    $row->name,
                    $row->parent_id,
                    $row->color,
                    $row->label_tree_id,
                    $row->source_id,
                ]);
            }, 100000);

        return $this->tmpPath;
    }

    /**
     * {@inheritdoc}
     */
    public function getFileName()
    {
        return 'labels.csv';
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
