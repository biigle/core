<?php

namespace Dias\Modules\Export\Support\Reports\Transects\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\ExecutesPythonScript;

class FullReport extends Report
{
    use ExecutesPythonScript;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'full annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'full_annotation_report';

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

        // put transect name to first line
        $csv->put([$this->transect->name]);

        $rows = $this->query()->get();

        // CHUNKING IS BROKEN SOMEHOW!
        // $query->chunkById(500, function ($rows) use ($csv) {
            foreach ($rows as $row) {
                $csv->put([
                    $row->filename,
                    $row->annotation_id,
                    $this->expandLabelName($row->label_id),
                    $row->shape_name,
                    $row->points,
                    $row->attrs
                ]);
            }
        // }, 'annotation_labels.id', 'annotation_labels_id');

        $csv->close();

        $this->executeScript('full_report', $this->transect->name);
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
            ->select(
                // 'annotation_labels.id as annotation_labels_id', // required for chunkById
                'images.filename',
                'annotations.id as annotation_id',
                'annotation_labels.label_id',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs'
            )
            ->where('images.transect_id', $this->transect->id)
            ->when($this->isRestricted(), function ($query) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds());
            })
            ->orderBy('annotations.id');
    }
}
