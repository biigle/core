<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\User;
use DB;

class BasicReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'basic image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'basic_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'pdf';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $labels = $this->query()->get();

        if ($this->shouldSeparateLabelTrees() && $labels->isNotEmpty()) {
            $labels = $labels->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $labels->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $this->tmpFiles[] = $this->createCsv($labels->get($id), $name);
            }
        } elseif ($this->shouldSeparateUsers() && $labels->isNotEmpty()) {
            $labels = $labels->groupBy('user_id');
            $users = User::whereIn('id', $labels->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $this->tmpFiles[] = $this->createCsv($labels->get($id), $name);
            }
        } else {
            $this->tmpFiles[] = $this->createCsv($labels);
        }

        $this->executeScript('basic_report', $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id')
            ->orderBy('labels.id');

        if ($this->shouldSeparateLabelTrees()) {
            $query->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateUsers()) {
            $query->addSelect('image_annotation_labels.user_id')
                ->groupBy('user_id', 'labels.id');
        }

        return $query;
    }

    /**
     * Create a CSV file for a single plot of this report.
     *
     * @param \Illuminate\Support\Collection $labels The labels/rows for the CSV
     * @param string $title The title to put in the first row of the CSV
     * @return CsvFile
     */
    protected function createCsv($labels, $title = '')
    {
        $csv = CsvFile::makeTmp();
        // The title must not be empty as the Python
        // script expects one line as title.
        $csv->put($title);

        foreach ($labels as $label) {
            $csv->putCsv([$label->name, $label->color, $label->count]);
        }

        $csv->close();

        return $csv;
    }
}
