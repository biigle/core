<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ExecutesPythonScript;

class BasicReport extends Report
{
    use ExecutesPythonScript;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'basic annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'basic_annotation_report';

    /**
     * File extension of the report file.
     *
     * @var string
     */
    protected $extension = 'pdf';

    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $csv = CsvFile::makeTmp();
        $this->tmpFiles[] = $csv;

        // put transect name to first line
        $csv->put([$this->transect->name]);

        $rows = $this->query()->get();

        foreach ($rows as $row) {
            $csv->put([$row->name, $row->color, $row->count]);
        }

        $csv->close();

        $this->executeScript('basic_report', $this->transect->name);
    }

    /**
     * Assemble a new DB query for the transect of this report.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query()
    {
        return DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestricted(), function ($query) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds());
            })
            ->select(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id')
            ->orderBy('labels.id');
    }
}
