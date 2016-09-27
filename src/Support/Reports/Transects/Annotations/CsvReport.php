<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends Report
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'zip';

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $csv = CsvFile::makeTmp();
        $this->tmpFiles[] = $csv;

        // add column headers
        $csv->put([
            'annotation_label_id',
            'label_id',
            'label_name',
            'user_id',
            'firstname',
            'lastname',
            'image_id',
            'filename',
            'shape_id',
            'shape_name',
            'points',
            'attributes',
        ]);

        $rows = $this->query()->get();

        // CHUNKING IS BROKEN SOMEHOW!
        // $query->chunkById(500, function ($rows) use ($csv) {
            foreach ($rows as $row) {
                $csv->put([
                    $row->annotation_label_id,
                    $row->label_id,
                    $this->expandLabelName($row->label_id),
                    $row->user_id,
                    $row->firstname,
                    $row->lastname,
                    $row->image_id,
                    $row->filename,
                    $row->shape_id,
                    $row->shape_name,
                    $row->points,
                    $row->attrs,
                ]);
            }
        // }, 'annotation_labels.id', 'annotation_label_id');

        $csv->close();

        $this->makeZip([
            $csv->path => $this->sanitizeFilename("{$this->transect->id}-{$this->transect->name}", 'csv'),
        ]);
    }

    /**
     * Assemble a new DB query for the transect of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        return DB::table('annotation_labels')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->join('users', 'annotation_labels.user_id', '=', 'users.id')
            ->select([
                'annotation_labels.id as annotation_label_id',
                'annotation_labels.label_id',
                'users.id as user_id',
                'users.firstname',
                'users.lastname',
                'images.id as image_id',
                'images.filename',
                'shapes.id as shape_id',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs',
            ])
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestricted(), function ($query) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds());
            })
            ->orderBy('annotation_labels.id');
    }
}
