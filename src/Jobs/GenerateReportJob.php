<?php

namespace Dias\Modules\Export\Jobs;

use Exception;
use Dias\User;
use Dias\Project;
use Dias\Jobs\Job;
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
        $this->project = $project;
        $this->user = $user;
        $this->tmpFiles = [];
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
