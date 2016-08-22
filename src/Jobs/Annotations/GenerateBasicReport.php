<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Basic;

class GenerateBasicReport extends GenerateAnnotationReportJob
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

            $rows = $this->query($id)->get();

            foreach ($rows as $row) {
                $csv->put([
                    $row->name,
                    $row->color,
                    $row->count,
                ]);
            }

            $csv->close();
        }

        $this->report = app()->make(Basic::class);
        $this->report->generate($this->project, $this->tmpFiles);

        $this->sendReportMail(
            'basic annotation',
            'basic_annotation',
            $this->report->basename(),
            'pdf'
        );
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     *
     * @return \Illuminate\Database\Query\Builder
     */
    protected function query($id)
    {
        return DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->where('images.transect_id', $id)
            ->when($this->restricted, function ($query) use ($id) {
                return $query->whereNotIn('annotations.id', $this->getSkipIds($id));
            })
            ->select(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id');
    }
}
