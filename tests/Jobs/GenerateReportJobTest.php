<?php

namespace Biigle\Tests\Modules\Reports\Jobs;

use Mockery;
use TestCase;
use Biigle\User;
use Carbon\Carbon;
use Biigle\Modules\Reports\Report;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Notifications\ReportReady;

class GenerateReportJobTest extends TestCase
{
    public function testHandle()
    {
        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once()->with(Mockery::type(ReportReady::class));
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('save')->once();
        with(new GenerateReportJob($report))->handle();
    }
}
