<?php

namespace Biigle\Jobs;

use Biigle\Jobs\Job;
use Biigle\Notifications\ReportReady;
use Biigle\Report;
use Biigle\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateReportJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The report that should be generated.
     *
     * @var Report
     */
    public $report;

    /**
     * Create a new job instance.
     *
     * @param Report $report The report to generate
     */
    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $this->report->generate();
        $this->report->ready_at = new Carbon;
        $this->report->save();

        $disableNotifications = $this->report->options['disableNotifications'] ?? false;

        if (!$disableNotifications) {
            $this->report->user->notify(new ReportReady($this->report));
        }
    }
}
