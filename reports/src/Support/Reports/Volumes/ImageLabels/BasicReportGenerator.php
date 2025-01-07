<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageLabels;

use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\Volumes\VolumeReportGenerator;
use Biigle\User;
use DB;

class BasicReportGenerator extends VolumeReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'basic image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'basic_image_label_report';

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
    public function query()
    {
        $query = DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->select('images.id', 'images.filename', 'image_labels.label_id')
            ->where('images.volume_id', $this->source->id)
            ->when($this->isRestrictedToLabels(), function ($query) {
                return $this->restrictToLabelsQuery($query, 'image_labels');
            })
            ->orderBy('images.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'labels.id', '=', 'image_labels.label_id')
                ->addSelect('labels.label_tree_id');
        } elseif ($this->shouldSeparateusers()) {
            $query->addSelect('image_labels.user_id');
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
        $csv->put(['image_id', 'image_filename', 'label_hierarchies']);

        foreach ($rows->groupBy('id') as $row) {
            $csv->put([
                $row[0]->id,
                $row[0]->filename,
                $row->map(function ($row) {
                    return $this->expandLabelName($row->label_id);
                })->implode(', '),
            ]);
        }

        $csv->close();

        return $csv;
    }
}
