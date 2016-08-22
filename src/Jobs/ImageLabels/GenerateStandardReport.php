<?php

namespace Dias\Modules\Export\Jobs\ImageLabels;

use DB;
use Mail;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\ImageLabels\Standard as Report;

class GenerateStandardReport extends GenerateReportJob
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

            $rows = $this->query($id)->get()->groupBy('id');

            foreach ($rows as $imageId => $row) {
                $csv->put([
                    $row[0]->id,
                    $row[0]->filename,
                    $row->map(function ($row) {
                        return $row->name;
                    })->implode(', '),
                ]);
            }

            $csv->close();
        }

        $this->report = app()->make(Report::class);
        $this->report->generate($this->project, $this->tmpFiles);

        $this->sendReportMail(
            'image label',
            'image_label',
            $this->report->basename(),
            'xlsx'
        );
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @param int $id Transect ID
     * @return \Illuminate\Database\Query\Builder
     */
    private function query($id)
    {
        return DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('labels', 'image_labels.label_id', '=', 'labels.id')
            ->select('images.id', 'images.filename', 'labels.name')
            ->where('images.transect_id', $id)
            ->orderBy('images.filename');
    }
}
