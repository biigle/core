<?php

namespace Dias\Modules\Export\Support\Reports\Transects\ImageLabels;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Report;
use Dias\Modules\Export\Support\Reports\MakesZipArchives;

class CsvReport extends Report
{
    use MakesZipArchives;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_image_label_report';

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
            'image_label_id',
            'image_id',
            'filename',
            'user_id',
            'firstname',
            'lastname',
            'label_id',
            'label_name',
        ]);

        $rows = $this->query()->get();

        // CHUNKING IS BROKEN SOMEHOW!
        // $query->chunkById(500, function ($rows) use ($csv) {
            foreach ($rows as $row) {
                $csv->put([
                    $row->image_label_id,
                    $row->image_id,
                    $row->filename,
                    $row->user_id,
                    $row->firstname,
                    $row->lastname,
                    $row->label_id,
                    $this->expandLabelName($row->label_id),
                ]);
            }
        // }, 'image_labels.id', 'image_label_id');

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
        return DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('users', 'image_labels.user_id', '=', 'users.id')
            ->select([
                'image_labels.id as image_label_id',
                'image_labels.image_id',
                'images.filename',
                'image_labels.user_id',
                'users.firstname',
                'users.lastname',
                'image_labels.label_id',
            ])
            ->where('images.transect_id', $this->transect->id)
            ->orderBy('images.filename');
    }
}
