<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\Annotations;

use DB;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;

class AbundanceReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'abundance annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'abundance_annotation_report';

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
                $rowGroup = $rows->get($id);
                $labels = Label::whereIn('id', $rowGroup->pluck('label_id')->unique())->get();
                $this->tmpFiles[] = $this->createCsv($rowGroup, $name, $labels);
            }
        } else {
            $labels = Label::whereIn('id', $rows->pluck('label_id')->unique())->get();
            $this->tmpFiles[] = $this->createCsv($rows, $this->source->name, $labels);
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
            ->orderBy('images.filename')
            ->select(DB::raw('images.filename, annotation_labels.label_id, count(annotation_labels.label_id) as count'))
            ->groupBy('annotation_labels.label_id', 'images.id');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id')
                ->groupBy('annotation_labels.label_id', 'images.id', 'labels.label_tree_id');
        }

        return $query;
    }

    /**
     * Create a CSV file for a single sheet of the spreadsheet of this report.
     *
     * @param \Illuminate\Support\Collection $rows The rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @param  array $labels
     *
     * @return CsvFile
     */
    protected function createCsv($rows, $title = '', $labels)
    {
        $rows = $rows->groupBy('filename');

        $csv = CsvFile::makeTmp();
        $csv->put([$title]);

        $columns = ['image_filename'];
        foreach ($labels as $label) {
            $columns[] = $label->name;
        }
        $csv->put($columns);


        foreach ($rows as $filename => $annotations) {
            $row = [$filename];
            $annotations = $annotations->keyBy('label_id');
            foreach ($labels as $label) {
                if ($annotations->has($label->id)) {
                    $row[] = $annotations[$label->id]->count;
                } else {
                    $row[] = 0;
                }
            }

            $csv->put($row);
        }

        $csv->close();

        return $csv;
    }
}
