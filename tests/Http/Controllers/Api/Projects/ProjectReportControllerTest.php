<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Modules\Reports\ReportType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

class ProjectReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
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

    public function testStoreEmptyProject()
    {
        $projectId = $this->project()->id;
        $this->beGuest();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::first()->id,
            ])
            ->assertStatus(422);
    }
}
