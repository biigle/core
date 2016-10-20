<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\Projects\Annotations\BasicReport;

class ExportModuleHttpControllersApiProjectsAnnotationsBasicReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/annotations/basic")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/annotations/basic")
            ->assertResponseOk();

        $job = $this->dispatchedJobs[0];
        $report = $job->report;
        $this->assertInstanceOf(BasicReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/projects/{$id}/reports/annotations/basic", [
                'exportArea' => true
            ])
            ->assertResponseOk();

        $job = $this->dispatchedJobs[1];
        $report = $job->report;
        $this->assertInstanceOf(BasicReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
