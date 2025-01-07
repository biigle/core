<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Arr;
use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\User;
use DB;

class FullReportGenerator extends AnnotationReportGenerator
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'full image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'full_image_annotation_report';

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

        $this->executeScript('full_report', $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery([
                'images.filename',
                'image_annotations.id as annotation_id',
                'image_annotation_labels.label_id',
                'shapes.name as shape_name',
                'image_annotations.points',
                'images.attrs',
            ])
            ->join('shapes', 'image_annotations.shape_id', '=', 'shapes.id')
            ->orderBy('image_annotations.id');

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
        $csv->put(['image filename', 'annotation id', 'annotation shape', 'x/radius', 'y', 'labels', 'image area in m²']);

        foreach ($rows as $row) {
            $csv->put([
                $row->filename,
                $row->annotation_id,
                $this->expandLabelName($row->label_id),
                $row->shape_name,
                $row->points,
                $this->getArea($row->attrs),
            ]);
        }

        $csv->close();

        return $csv;
    }

    /**
     * Parses the image attrs JSON object to retrieve the computed area of the laserpoint detection.
     *
     * @param  string $attrs Image attrs JSON as string
     * @return mixed The number or `null`
     */
    protected function getArea($attrs)
    {
        $attrs = json_decode($attrs, true);
        if (is_array($attrs)) {
            return Arr::get($attrs, 'laserpoints.area');
        }
    }
}
