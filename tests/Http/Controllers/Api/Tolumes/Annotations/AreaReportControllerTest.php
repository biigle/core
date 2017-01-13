<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Volumes\Annotations;

use ApiTestCase;
use Biigle\Modules\Export\Jobs\GenerateReportJob;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\AreaReport;

class AreaReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->volume()->id;

        $this->post("api/v1/volumes/{$id}/reports/annotations/area")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/volumes/{$id}/reports/annotations/area")
            ->assertResponseOk();

        $job = $this->dispatchedJobs[0];
        $report = $job->report;
        $this->assertInstanceOf(AreaReport::class, $report);
        $this->assertEquals($id, $report->volume->id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/volumes/{$id}/reports/annotations/area", [
                'exportArea' => true
            ])
            ->assertResponseOk();

        $job = $this->dispatchedJobs[1];
        $report = $job->report;
        $this->assertInstanceOf(AreaReport::class, $report);
        $this->assertEquals($id, $report->volume->id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
