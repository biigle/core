<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Modules\Export\ReportType;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

class ProjectReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $projectId = $this->project()->id;
        $typeId = ReportType::first()->id;

        $this->doTestApiRoute('POST', "api/v1/projects/{$projectId}/reports");

        $this->beUser();
        $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertResponseStatus(403);

        $this->beGuest();
        $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertResponseStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($projectId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
            ])
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($projectId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
