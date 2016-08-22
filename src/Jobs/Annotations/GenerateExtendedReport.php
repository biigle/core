<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Extended;

class GenerateExtendedReport extends GenerateAnnotationReportJob
{
    /**
     * Generate the report.
     *
     * @return void
     */
    public function generateReport()
    {
        $transects = $this->project->transects()
            ->pluck('name', 'id');

        foreach ($transects as $id => $name) {
            $csv = CsvFile::makeTmp();
            $this->tmpFiles[] = $csv;

            // put transect name to first line
            $csv->put([$name]);

            $query = $this->query($id);

            $query->chunkById(500, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->put([
                        $row->filename,
                        $row->name,
                        $row->count,
                    ]);
                }
            }, 'images.id', 'images_id');

            $csv->close();
        }

        $this->report = app()->make(Extended::class);
        $this->report->generate($this->project, $this->tmpFiles);

        $this->sendReportMail(
            'extended annotation',
            'extended_annotation',
            $this->report->basename(),
            'xlsx'
        );
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     *
     * @return \Illuminate\Database\Query\Builder
     */
    private function query($id)
    {
        return DB::table('images')
            ->join('annotations', 'annotations.image_id', '=', 'images.id')
            ->join('annotation_labels', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            // images.id is required for chunkById
            ->select(DB::raw('images.id as images_id, images.filename, labels.name, count(labels.id) as count'))
            ->groupBy('labels.id', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            // order by is essential for chunking!
            ->orderBy('images.id')
            ->orderBy('labels.id');
    }
}
