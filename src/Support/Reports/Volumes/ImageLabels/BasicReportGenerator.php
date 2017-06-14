<?php

namespace Biigle\Modules\Export\Support\Reports\Volumes\ImageLabels;

use DB;
use Biigle\LabelTree;
use Biigle\Modules\Export\Support\CsvFile;
use Biigle\Modules\Export\Support\Reports\Volumes\VolumeReportGenerator;

class BasicReportGenerator extends VolumeReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'basic image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'basic_image_label_report';

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

        $this->executeScript('extended_report', $path);
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
            ->select('images.id', 'images.filename', 'image_labels.label_id')
            ->where('images.volume_id', $this->source->id)
            ->orderBy('images.filename');

        if ($this->shouldSeparateLabelTrees()) {
            $query->join('labels', 'labels.id', '=', 'image_labels.label_id')
                ->addSelect('labels.label_tree_id');
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
