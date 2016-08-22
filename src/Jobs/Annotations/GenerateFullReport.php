<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Mail;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Annotations\Full;

class GenerateFullReport extends GenerateReportJob
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

            $query = $this->query()->where('images.transect_id', $id);

            $query->chunk(500, function ($rows) use ($csv) {
                foreach ($rows as $row) {
                    $csv->put([
                        $row->filename,
                        $row->annotation_id,
                        $row->label_name,
                        $row->shape_name,
                        $row->points,
                        $row->attrs
                    ]);
                }
            });

            $csv->close();
        }

        $this->report = app()->make(Full::class);
        $this->report->generate($this->project, $this->tmpFiles);

        Mail::send('export::emails.report', [
            'user' => $this->user,
            'project' => $this->project,
            'type' => 'full',
            'uuid' => $this->report->basename(),
            'filename' => "biigle_{$this->project->id}_full_report.xlsx",
        ], function ($mail) {
            if ($this->user->firstname && $this->user->lastname) {
                $name = "{$this->user->firstname} {$this->user->lastname}";
            } else {
                $name = null;
            }

            $mail->subject("BIIGLE full report for project {$this->project->name}")
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
            ->join('shapes', 'annotations.shape_id', '=', 'shapes.id')
            ->select(
                'images.filename',
                'annotations.id as annotation_id',
                'labels.name as label_name',
                'shapes.name as shape_name',
                'annotations.points',
                'images.attrs'
            )
            // order by is essential for chunking!
            ->orderBy('annotations.id')
            ->orderBy('labels.id')
            ->orderBy('annotation_labels.user_id');
    }
}
