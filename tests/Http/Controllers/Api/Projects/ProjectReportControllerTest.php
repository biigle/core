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
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($projectId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);
        $this->assertEquals(false, $report->options['newestLabel']);

        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($projectId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
        $this->assertEquals(true, $report->options['newestLabel']);
    }
}
