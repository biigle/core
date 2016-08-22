<?php

namespace Dias\Modules\Export\Jobs;

use DB;
use Mail;
use Exception;
use Dias\User;
use Dias\Project;
use Dias\Jobs\Job;
use Dias\Modules\Export\Transect;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

abstract class GenerateReportJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The project for which the report should be generated.
     *
     * @var Project
     */
    protected $project;

    /**
     * The user to notify of the finished report.
     *
     * @var User
     */
    protected $user;

    /**
     * The report that should be generated.
     *
     * @var \Dias\Modules\Export\Support\Reports\Report
     */
    protected $report;

    /**
     * Temporary files that are created when generating a report.
     *
     * @var array
     */
    protected $tmpFiles;

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
        $this->user = $user;
        $this->project = $project;
        $this->tmpFiles = [];
    }

    /**
     * Send the email with the link to the report file
     *
     * @param string $type Report type
     * @param string $filename Filename used for the download file
     * @param string $uuid Refort file UUID for the download link
     * @param string $filetype Type of the report file, e.g. `pdf` or `xls`.
     * @return void
     */
    protected function sendReportMail($type, $filename, $uuid, $filetype)
    {
        $params = [
            'user' => $this->user,
            'project' => $this->project,
            'type' => $type,
            'uuid' => $uuid,
            'filename' => "biigle_{$this->project->id}_{$filename}_report.{$filetype}",
        ];

        // from annotation report, this will be handled more elegantly in the future
        if (isset($this->restricted) && $this->restricted) {
            $params['restricted'] = true;
        }

        return Mail::send('export::emails.report', $params, function ($mail) use ($type) {
            if ($this->user->firstname && $this->user->lastname) {
                $name = "{$this->user->firstname} {$this->user->lastname}";
            } else {
                $name = null;
            }

            $mail->subject("BIIGLE {$type} report for project {$this->project->name}")
                ->to($this->user->email, $name);
        });
    }

    /**
     * Execute the job
     *
     * @return void
     */
    public function handle()
    {
        try {
            $this->generateReport();
        } catch (Exception $e) {
            if (isset($this->report)) {
                $this->report->delete();
                throw $e;
            }
        } finally {
            array_walk($this->tmpFiles, function ($file) {
                $file->delete();
            });
        }
    }

    /**
     * Generate the report
     *
     * @return void
     */
    protected abstract function generateReport();
}
