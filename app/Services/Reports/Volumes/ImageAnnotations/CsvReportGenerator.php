<?php

namespace Biigle\Services\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\MakesZipArchives;
use Biigle\User;
use DB;

class CsvReportGenerator extends AnnotationReportGenerator
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'CSV image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_image_annotation_report';

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
        $exists = $this->initQuery()->exists();
        $toZip = [];

        if ($this->shouldSeparateLabelTrees() && $exists) {
            $treeIds = $this->initQuery()
                ->select('labels.label_tree_id')
                ->distinct()
                ->pluck('label_tree_id');

            $trees = LabelTree::whereIn('id', $treeIds)->pluck('name', 'id');

            foreach ($trees as $id => $name) {
                $csv = $this->createCsv($this->query()->where('labels.label_tree_id', $id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } elseif ($this->shouldSeparateUsers() && $exists) {
            $userIds = $this->initQuery()
                ->select('user_id')
                ->distinct()
                ->pluck('user_id');

            $users = User::whereIn('id', $userIds)
                ->selectRaw("id, concat(firstname, ' ', lastname) as name")
                ->pluck('name', 'id');

            foreach ($users as $id => $name) {
                $csv = $this->createCsv($this->query()->where('user_id', $id));
                $this->tmpFiles[] = $csv;
                $toZip[$csv->getPath()] = $this->sanitizeFilename("{$id}-{$name}", 'csv');
            }
        } else {
            $csv = $this->createCsv($this->query());
            $this->tmpFiles[] = $csv;
            $toZip[$csv->getPath()] = $this->sanitizeFilename("{$this->source->id}-{$this->source->name}", 'csv');
        }

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
                'users.firstname',
                'users.lastname',
                'images.id as image_id',
                'images.filename',
                'images.lng as longitude',
                'images.lat as latitude',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'image_annotations.points',
                'images.attrs',
                'image_annotations.id as annotation_id',
                'image_annotation_labels.created_at',
            ])
            ->join('shapes', 'image_annotations.shape_id', '=', 'shapes.id')
            ->leftJoin('users', 'image_annotation_labels.user_id', '=', 'users.id')
            ->orderBy('image_annotation_labels.id');

        return $query;
    }

    /**
     * Create a CSV file for this report.
     *
     * @param \Illuminate\Database\Query\Builder $query The query for the CSV rows
     * @return CsvFile
     */
    protected function createCsv($query)
    {
        $csv = CsvFile::makeTmp();
        // column headers
        $csv->putCsv([
            'annotation_label_id',
            'label_id',
            'label_name',
            'label_hierarchy',
            'user_id',
            'firstname',
            'lastname',
            'image_id',
            'filename',
            'image_longitude',
            'image_latitude',
            'shape_id',
            'shape_name',
            'points',
            'attributes',
            'annotation_id',
            'created_at',
        ]);

        $query->eachById(function ($row) use ($csv) {
            $csv->putCsv([
                $row->annotation_label_id,
                $row->label_id,
                $row->label_name,
                $this->expandLabelName($row->label_id),
                $row->user_id,
                $row->firstname,
                $row->lastname,
                $row->image_id,
                $row->filename,
                $row->longitude,
                $row->latitude,
                $row->shape_id,
                $row->shape_name,
                $row->points,
                $row->attrs,
                $row->annotation_id,
                $row->created_at,
            ]);
        }, column: 'image_annotation_labels.id', alias: 'annotation_label_id');

        $csv->close();

        return $csv;
    }
}
