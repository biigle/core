<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\User;
use DB;

class CocoReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'coco image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'coco_image_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'zip';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $rows = $this->query()->get();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('label_tree_id');
            $trees = LabelTree::whereIn('id', $rows->keys())->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($rows->get($id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'json');
            }
        } elseif ($this->shouldSeparateUsers() && $rows->isNotEmpty()) {
            $rows = $rows->groupBy('user_id');
            $users = User::whereIn('id', $rows->keys())
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->orderBy('id')
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $csv = $this->createCsv($rows->get($id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'json');
            }
        } else {
            $csv = $this->createCsv($rows);
            $this->tmpFiles[] = $csv;
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->source->id}-{$this->source->name}", 'json');
        }
        $this->executeScript('to_coco', ''); // the temporary csv files are overwritten with the respective json files therefore the argument is not needed
        $this->makeZip($toZip, $path);
    }

    /**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this
            ->initQuery([
                'image_annotation_labels.id as annotation_label_id',
                'image_annotation_labels.label_id',
                'labels.name as label_name',
                'users.id as user_id',
                'images.id as image_id',
                'images.filename',
                'images.lng as longitude',
                'images.lat as latitude',
                'shapes.name as shape_name',
                'image_annotations.points',
                'images.attrs',
            ])
            ->join('shapes', 'image_annotations.shape_id', '=', 'shapes.id')
            ->leftJoin('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->orderBy('image_annotation_labels.id');

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
        $header = [
            'annotation_label_id',
            'label_id',
            'label_name',
            'image_id',
            'filename',
            'image_longitude',
            'image_latitude',
            'shape_name',
            'points',
        ];

        if ($this->getAttributes()) {
            $header[] = 'attributes';
        }

        $csv->putCsv($header);

        foreach ($rows as $row) {
            $toInsert = [
                $row->annotation_label_id,
                $row->label_id,
                $row->label_name,
                $row->image_id,
                $row->filename,
                $row->longitude,
                $row->latitude,
                $row->shape_name,
                $row->points,
            ];

            if ($this->getAttributes()) {
                $toInsert[] = $row->attrs;
            }

            $csv->putCsv($toInsert);
        }

        $csv->close();

        return $csv;
    }
}
