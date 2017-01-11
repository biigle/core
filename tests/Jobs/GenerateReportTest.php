<?php

namespace Biigle\Tests\Modules\Export\Jobs;

use Mockery;
use TestCase;
use Biigle\User;
use Biigle\Modules\Export\Support\Reports\Report;
use Biigle\Modules\Export\Jobs\GenerateReportJob;
use Biigle\Modules\Export\Notifications\ReportReady;

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
