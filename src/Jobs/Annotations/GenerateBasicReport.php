<?php

namespace Dias\Modules\Export\Jobs\Annotations;

use DB;
use Mail;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Basic;

class GenerateBasicReport extends GenerateReportJob
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

            $report = app()->make(Basic::class);
            $report->generate($this->project, $tmpFiles);

            Mail::send('export::emails.report', [
                'user' => $this->user,
                'project' => $this->project,
                'type' => 'basic',
                'uuid' => $report->basename(),
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
            ->select(DB::raw('labels.name, labels.color, count(labels.id) as count'))
            ->groupBy('labels.id')
            ->orderBy('labels.id');
    }
}
