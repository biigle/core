<?php

namespace Biigle\Modules\Reports\Jobs;

use Biigle\User;
use Carbon\Carbon;
use Biigle\Jobs\Job;
use Biigle\Modules\Reports\Report;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Biigle\Modules\Reports\Notifications\ReportReady;

class GenerateReportJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * Memory limit to set during generating a report.
     *
     * @var string
     */
    const MEMORY_LIMIT = '512M';

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

        try {
            $memoryLimit = ini_get('memory_limit');
            // increase memory limit for generating large reports
            ini_set('memory_limit', self::MEMORY_LIMIT);

            $this->report->generate();
        } finally {
            // restore default memory limit
            ini_set('memory_limit', $memoryLimit);
        }

        $this->report->ready_at = new Carbon;
        $this->report->save();
        $this->report->user->notify(new ReportReady($this->report));
    }
}
