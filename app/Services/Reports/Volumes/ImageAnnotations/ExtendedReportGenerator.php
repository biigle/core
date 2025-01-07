<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\User;

class ExtendedReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'extended image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'extended_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'xlsx';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $rows = $this->query()->get();

        if ($this->shouldSeparateLabelTrees() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $this->tmpFiles[] = $this->createCsv($rows->get($id), $name);
            }
        } elseif ($this->shouldSeparateUsers() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('user_id');
            $users = User::whereIn('id', $rows->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
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
            $query->selectRaw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count, labels.label_tree_id')
                ->groupBy('image_annotation_labels.label_id', 'images.id', 'labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->selectRaw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count, image_annotation_labels.user_id')
                ->groupBy('image_annotation_labels.label_id', 'images.id', 'image_annotation_labels.user_id');
        } else {
            $query->selectRaw('images.filename, image_annotation_labels.label_id, count(image_annotation_labels.label_id) as count')
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
