<?php

namespace Biigle\Modules\Export\Support\Reports\Volumes\ImageLabels;

use DB;
use Biigle\LabelTree;
use Biigle\Modules\Export\Support\CsvFile;
use Biigle\Modules\Export\Support\Reports\Volumes\Report;
use Biigle\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends Report
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_image_label_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $rows = $this->query()->get();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($rows->get($id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } else {
            $csv = $this->createCsv($rows);
            $this->tmpFiles[] = $csv;
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->volume->id}-{$this->volume->name}", 'csv');
        }

        $this->makeZip($toZip);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('users', 'image_labels.user_id', '=', 'users.id')
            ->join('labels', 'labels.id', '=', 'image_labels.label_id')
            ->select([
                'image_labels.id as image_label_id',
                'image_labels.image_id',
                'images.filename',
                'images.lng as longitude',
                'images.lat as latitude',
                'image_labels.user_id',
                'users.firstname',
                'users.lastname',
                'image_labels.label_id',
                'labels.name as label_name',
            ])
            ->where('images.volume_id', $this->volume->id)
            ->orderBy('images.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        }

        return $query;
    }

    /**
     * Create a CSV file for this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @return CsvFile
     */
    protected function createCsv($rows)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->put([
            'image_label_id',
            'image_id',
            'filename',
            'longitude',
            'latitude',
            'user_id',
            'firstname',
            'lastname',
            'label_id',
            'label_name',
            'label_hierarchy',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->image_label_id,
                $row->image_id,
                $row->filename,
                $row->longitude,
                $row->latitude,
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
            ]);
        }

        $csv->close();

        return $csv;
    }
}
