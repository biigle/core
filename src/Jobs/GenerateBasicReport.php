<?php

namespace Dias\Modules\Export\Jobs;

use Mail;
use DB;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Basic;
use Dias\Jobs\Job;
use Dias\Project;
use Dias\User;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateBasicReport extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    private $project;

    /**
     * The user to notify of the finished report
     *
     * @var User
     */
    private $user;

    /**
     * Create a new job instance.
     *
     * @param Project $project The project for which the report should be generated.
     * @param User $user The user to notify of the finished report
     *
     * @return void
     */
    public function __construct(Project $project, User $user)
    {
        $this->project = $project;
        $this->user = $user;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $transects = $this->project->transects()
            ->pluck('name', 'id');

        $tmpPath = config('export.tmp_storage');
        $tmpFiles = [];

        $query = DB::table('labels')
            ->join('annotation_labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->join('annotations', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->join('images', 'annotations.image_id', '=', 'images.id')
            ->select('labels.id', 'labels.name', 'labels.color');

        try {
            foreach ($transects as $id => $name) {
                $csv = CsvFile::makeTmp();
                $tmpFiles[] = $csv;

                // put transect name to first line
                $csv->put([$name]);

                $query->where('images.transect_id', $id)
                    ->chunk(500, function ($rows) use ($csv) {
                        foreach ($rows as $row) {
                            $csv->put((array) $row);
                        }
                    });

                $csv->close();
            }

            $report = app()->make(Basic::class);
            $report->generate($this->project, $tmpFiles);

            Mail::send('export::emails.report', [
                'user' => $this->user,
                'project' => $this->project,
                'type' => 'basic',
                'uuid' => $report->basename(),
            ], function ($mail) {
                if ($this->user->firstname && $this->user->lastname) {
                    $name = "{$this->user->firstname} {$this->user->lastname}";
                } else {
                    $name = null;
                }

                $mail->subject("BIIGLE basic report for project {$this->project->name}")
                    ->to($this->user->email, $name);
            });
        } finally {
            array_walk($tmpFiles, function ($file) {
                $file->delete();
            });
        }
    }
}
