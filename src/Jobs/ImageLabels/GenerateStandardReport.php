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

            $rows = $this->query()
                ->where('images.transect_id', $id)
                ->get()
                ->groupBy('id');

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

        Mail::send('export::emails.report', [
            'user' => $this->user,
            'project' => $this->project,
            'type' => 'image label',
            'uuid' => $this->report->basename(),
            'filename' => "biigle_{$this->project->id}_image_label_report.xlsx",
        ], function ($mail) {
            if ($this->user->firstname && $this->user->lastname) {
                $name = "{$this->user->firstname} {$this->user->lastname}";
            } else {
                $name = null;
            }

            $mail->subject("BIIGLE image label report for project {$this->project->name}")
                ->to($this->user->email, $name);
        });
    }

    /**
     * Assemble a new DB query for a transect.
     *
     * @return \Illuminate\Database\Query\Builder
     */
    private function query()
    {
        return DB::table('image_labels')
            ->join('images', 'image_labels.image_id', '=', 'images.id')
            ->join('labels', 'image_labels.label_id', '=', 'labels.id')
            ->select('images.id', 'images.filename', 'labels.name')
            ->orderBy('images.filename');
    }
}
