<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\LabelTree;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends Report
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_annotation_report';

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
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->transect->id}-{$this->transect->name}", 'csv');
        }

        $this->makeZip($toZip);
    }

    /**
     * Assemble a new DB query for the transect of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = DB::table('annotation_labels')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->join('users', 'annotation_labels.user_id', '=', 'users.id')
            ->select([
                'annotation_labels.id as annotation_label_id',
                'annotation_labels.label_id',
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                'images.id as image_id',
                'images.filename',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs',
            ])
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestricted(), function ($query) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds());
            })
            ->orderBy('annotation_labels.id');

        if ($this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
                ->addSelect(['labels.label_tree_id']);
        }

        return $query;
    }

    /**
     * Create a CSV file for this report
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @return CsvFile
     */
    protected function createCsv($rows)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->put([
            'annotation_label_id',
            'label_id',
            'label_name',
            'user_id',
            'firstname',
            'lastname',
            'image_id',
            'filename',
            'shape_id',
            'shape_name',
            'points',
            'attributes',
        ]);

        foreach ($rows as $row) {
            $csv->put([
                $row->annotation_label_id,
                $row->label_id,
                $this->expandLabelName($row->label_id),
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->image_id,
                $row->filename,
                $row->shape_id,
                $row->shape_name,
                $row->points,
                $row->attrs,
            ]);
        }

        $csv->close();

        return $csv;
    }
}
