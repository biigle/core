<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\Annotations;

use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;
use DB;

class ExtendedReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'extended annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'extended_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'xlsx';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $rows = $this->query()->get();

        if ($this->shouldSeparateLabelTrees()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $this->tmpFiles[] = $this->createCsv($rows->get($id), $name);
            }
        } else {
            $this->tmpFiles[] = $this->createCsv($rows, $this->source->name);
        }

        $this->executeScript('csvs_to_xlsx', $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery()
            ->orderBy('images.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->select(DB::raw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count, labels.label_tree_id'))
                ->groupBy('image_annotation_labels.label_id', 'images.id', 'labels.label_tree_id');
        } else {
            $query->select(DB::raw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count'))
                ->groupBy('image_annotation_labels.label_id', 'images.id');
        }

        return $query;
    }

    /**
     * Create a CSV file for a single sheet of the spreadsheet of this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @return CsvFile
     */
    protected function createCsv($rows, $title = '')
    {
        $csv = CsvFile::makeTmp();
        $csv->put([$title]);
        $csv->put(['image_filename', 'label_hierarchy', 'annotation_count']);

        foreach ($rows as $row) {
            $csv->put([
                $row->filename,
                $this->expandLabelName($row->label_id),
                $row->count,
            ]);
        }

        $csv->close();

        return $csv;
    }
}
