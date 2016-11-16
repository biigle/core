<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\AreaReport;

class ExportModuleHttpControllersApiTransectsAnnotationsAreaReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->transect()->id;

        $this->post("api/v1/transects/{$id}/reports/annotations/area")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/transects/{$id}/reports/annotations/area")
            ->assertResponseOk();

        $job = $this->dispatchedJobs[0];
        $report = $job->report;
        $this->assertInstanceOf(AreaReport::class, $report);
        $this->assertEquals($id, $report->transect->id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/transects/{$id}/reports/annotations/area", [
                'exportArea' => true
            ])
            ->assertResponseOk();

        $job = $this->dispatchedJobs[1];
        $report = $job->report;
        $this->assertInstanceOf(AreaReport::class, $report);
        $this->assertEquals($id, $report->transect->id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
