<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Mail;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Annotations\Basic;

class GenerateBasicReport extends GenerateReportJob
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

            $rows = $this->query()->where('images.transect_id', $id)->get();

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

        Mail::send('export::emails.report', [
            'user' => $this->user,
            'project' => $this->project,
            'type' => 'basic',
            'uuid' => $this->report->basename(),
            'filename' => "biigle_{$this->project->id}_basic_report.pdf",
        ], function ($mail) {
            if ($this->user->firstname && $this->user->lastname) {
                $name = "{$this->user->firstname} {$this->user->lastname}";
            } else {
                $name = null;
            }

            $mail->subject("BIIGLE basic report for project {$this->project->name}")
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
        return DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->select(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id')
            ->orderBy('labels.id');
    }
}
