<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\GenerateReportJob;
use Biigle\Notifications\ReportReady;
use Biigle\Report;
use Biigle\User;
use Carbon\Carbon;
use Mockery;
use TestCase;

class GenerateReportJobTest extends TestCase
{

    public function testHandleWithoutNotifications()
    {
        $opts = [];

        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once()->with(Mockery::type(ReportReady::class));
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('offsetExists')
            ->with('options')
            ->andReturn(true);
        $report->shouldReceive('setAttribute')
            ->with('options', $opts);
        $report->shouldReceive('getAttribute')
            ->with('options')
            ->andReturn($opts);
        $report->shouldReceive('save')->once();

        $report->options = $opts;
        with(new GenerateReportJob($report))->handle();
    }

    public function testHandleWithNotificationsTrue()
    {
        $opts = ['disableNotifications' => true];

        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldNotReceive('notify');
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('offsetExists')
            ->with('options')
            ->andReturn(true);
        $report->shouldReceive('setAttribute')
            ->with('options', $opts);
        $report->shouldReceive('getAttribute')
            ->with('options')
            ->andReturn($opts);
        $report->shouldReceive('save')->once();

        $report->options = $opts;
        with(new GenerateReportJob($report))->handle();
    }

    public function testHandleWithNotificationsFalse()
    {
        $opts = ['disableNotifications' => false];

        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once();
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        $report->shouldReceive('setAttribute')
            ->once()
            ->with('ready_at', Mockery::type(Carbon::class));
        $report->shouldReceive('offsetExists')
            ->with('options')
            ->andReturn(true);
        $report->shouldReceive('setAttribute')
            ->with('options', $opts);
        $report->shouldReceive('getAttribute')
            ->with('options')
            ->andReturn($opts);
        $report->shouldReceive('save')->once();

        $report->options = $opts;
        with(new GenerateReportJob($report))->handle();
    }

}
