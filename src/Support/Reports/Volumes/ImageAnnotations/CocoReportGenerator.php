<?php

namespace Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use Biigle\LabelTree;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\User;

class CocoReportGenerator extends AnnotationReportGenerator
{
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
    public $extension = 'json';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        
        $rows = $this->query()->get();
        $csv = $this->createCsv($rows);
        $this->tmpFiles[] = $csv;
        $this->executeScript('toCoco', $path);
    }

/**
     * Assemble a new DB query for the volume of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        $query = $this->initQuery([
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
            ])
            ->join('shapes', 'image_annotations.shape_id', '=', 'shapes.id')
            ->join('users', 'image_annotation_labels.user_id', '=', 'users.id')
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
        $csv->put([
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
        ]);

        foreach ($rows as $row) {
            $csv->put([
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
            ]);
        }

        $csv->close();

        return $csv;
    }
}
