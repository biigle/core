<?php

namespace Biigle\Tests\Modules\Reports\Jobs;

use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\Notifications\ReportReady;
use Biigle\Modules\Reports\Report;
use Biigle\User;
use Carbon\Carbon;
use Mockery;
use TestCase;

class GenerateReportJobTest extends TestCase
{
    public function testHandleNotify()
    {
        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once()->with(Mockery::type(ReportReady::class));
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('notify_when_ready')->set('notify_when_ready', true);
        $report->shouldReceive('getAttribute')->with('notify_when_ready')->andReturn(true);
        $report->shouldReceive('save')->once();
        with(new GenerateReportJob($report))->handle();
    }
    
    public function testHandleNoNotify()
    {
        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldNotReceive('notify'); // The user should not receive a notification if notify_when_ready is false.
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('notify_when_ready')->set('notify_when_ready', false);
        $report->shouldReceive('getAttribute')->with('notify_when_ready')->andReturn(false);
        $report->shouldReceive('save')->once();
        with(new GenerateReportJob($report))->handle();
    }
}
