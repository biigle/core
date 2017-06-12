<?php

namespace Biigle\Tests\Modules\Export\Jobs;

use Mockery;
use TestCase;
use Biigle\User;
use Biigle\Modules\Export\Report;
use Biigle\Modules\Export\Jobs\GenerateReportJob;
use Biigle\Modules\Export\Notifications\ReportReady;

class GenerateReportJobTest extends TestCase
{
    public function testHandle()
    {
        $report = Mockery::mock(Report::class);
        $report->shouldReceive('generate')->once();
        $user = Mockery::mock(User::class);
        $user->shouldReceive('notify')->once()->with(Mockery::type(ReportReady::class));
        $report->shouldReceive('getAttribute')->with('user')->andReturn($user);
        with(new GenerateReportJob($report))->handle();
    }
}
