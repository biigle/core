<?php

namespace Dias\Modules\Export\Jobs;

use Dias\User;
use Dias\Jobs\Job;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Dias\Modules\Export\Support\Reports\Report;
use Dias\Modules\Export\Notifications\ReportReady;

class GenerateReportJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The user to notify of the finished report.
     *
     * @var User
     */
    protected $user;

    /**
     * The report that should be generated.
     *
     * @var Report
     */
    protected $report;

    /**
     * Create a new job instance.
     *
     * @param Report $report The report to generate
     * @param User $user The user to notify of the finished report
     */
    public function __construct(Report $report, User $user)
    {
        $this->report = $report;
        $this->user = $user;
    }

    /**
     * Execute the job
     */
    public function handle()
    {
        $this->report->generate();
        $this->user->notify(new ReportReady($this->report));
    }
}
