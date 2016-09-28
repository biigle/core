<?php

namespace Dias\Modules\Export\Support\Reports\Transects\ImageLabels;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Report;

class BasicReport extends Report
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
     * @return void
     */
    public function generateReport()
    {
        $csv = CsvFile::makeTmp();
        $this->tmpFiles[] = $csv;

        $csv->put([$this->transect->name]);
        $csv->put(['image_id', 'image_filename', 'label_names']);

        $rows = $this->query()->get()->groupBy('id');

        foreach ($rows as $imageId => $row) {
            $csv->put([
                $row[0]->id,
                $row[0]->filename,
                $row->map(function ($row) {
                    return $this->expandLabelName($row->label_id);
                })->implode(', '),
            ]);
        }

        $csv->close();

        $this->executeScript('extended_report');
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
            ->select('images.id', 'images.filename', 'image_labels.label_id')
            ->where('images.transect_id', $this->transect->id)
            ->orderBy('images.filename');
    }
}
