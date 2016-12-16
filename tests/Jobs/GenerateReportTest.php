<?php

namespace Dias\Tests\Modules\Export\Jobs;

use Mockery;
use TestCase;
use Dias\User;
use Dias\Modules\Export\Support\Reports\Report;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Notifications\ReportReady;

class GenerateReportTest extends TestCase
{
    public function testHandle()
    {
        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once()->with(Mockery::type(ReportReady::class));
        with(new GenerateReportJob($report, $user))->handle();
    }
}
