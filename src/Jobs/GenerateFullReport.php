<?php

namespace Dias\Modules\Export\Jobs;

use Mail;
use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Full;

class GenerateFullReport extends GenerateReportJob
{
    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $transects = $this->project->transects()
            ->pluck('name', 'id');

        $tmpFiles = [];

        try {
            foreach ($transects as $id => $name) {
                $csv = CsvFile::makeTmp();
                $tmpFiles[] = $csv;

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
                        ]);
                    }
                });

                $csv->close();
            }

            $report = app()->make(Full::class);
            $report->generate($this->project, $tmpFiles);

            Mail::send('export::emails.report', [
                'user' => $this->user,
                'project' => $this->project,
                'type' => 'full',
                'uuid' => $report->basename(),
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
        } catch (\Exception $e) {
            if (isset($report)) {
                $report->delete();
                throw $e;
            }
        } finally {
            array_walk($tmpFiles, function ($file) {
                $file->delete();
            });
        }
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
                'annotations.points'
            )
            // order by is essential for chunking!
            ->orderBy('annotations.id')
            ->orderBy('labels.id')
            ->orderBy('annotation_labels.user_id');
    }
}
