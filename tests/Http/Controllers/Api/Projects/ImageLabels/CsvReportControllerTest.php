<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Projects\ImageLabels;

use ApiTestCase;
use Biigle\Modules\Export\Jobs\GenerateReportJob;
use Biigle\Modules\Export\Support\Reports\Projects\ImageLabels\CsvReport;

class CsvReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/image-labels/csv")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/image-labels/csv")
            ->assertResponseOk();

        $job = $this->dispatchedJobs[0];
        $report = $job->report;
        $this->assertInstanceOf(CsvReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/projects/{$id}/reports/image-labels/csv", [
                'exportArea' => true
            ])
            ->assertResponseOk();

        $job = $this->dispatchedJobs[1];
        $report = $job->report;
        $this->assertInstanceOf(CsvReport::class, $report);
        $this->assertEquals($id, $report->project->id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
