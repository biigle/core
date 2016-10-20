<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Projects\Annotations\FullReport;

class ExportModuleHttpControllersApiProjectsAnnotationsFullReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/annotations/full")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/annotations/full")
            ->assertResponseOk();

        $job = $this->dispatchedJobs[0];
        $report = $job->report;
        $this->assertInstanceOf(FullReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/projects/{$id}/reports/annotations/full", [
                'exportArea' => true
            ])
            ->assertResponseOk();

        $job = $this->dispatchedJobs[1];
        $report = $job->report;
        $this->assertInstanceOf(FullReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
