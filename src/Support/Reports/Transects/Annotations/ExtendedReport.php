<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;

class ExtendedReport extends Report
{
    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'extended annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'extended_annotation_report';

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
        $csv->put(['image_filename', 'label_name', 'annotation_count']);

        $rows = $this->query()->get();

        // DO NOT USE CHUNK BECAUSE IT DESTROYS groupBy!
        foreach ($rows as $row) {
            $csv->put([
                $row->filename,
                $this->expandLabelName($row->label_id),
                $row->count,
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
        return DB::table('images')
            ->join('annotations', 'annotations.image_id', '=', 'images.id')
            ->join('annotation_labels', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->select(DB::raw('images.filename, annotation_labels.label_id, count(annotation_labels.label_id) as count'))
            ->groupBy('annotation_labels.label_id', 'images.id')
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestricted(), function ($query) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds());
            })
            ->orderBy('images.filename');
    }
}
