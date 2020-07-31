<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;

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
        $this->markTestIncomplete('support video volumes');
    }

    public function testStoreEmptyProject()
    {
        $projectId = $this->project()->id;
        $this->beGuest();
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::first()->id,
            ])
            ->assertStatus(422);
    }

    public function testStoreVideoAnnotations()
    {
        $projectId = $this->project()->id;
        $this->beGuest();
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::videoAnnotationsCsvId(),
            ])
            ->assertStatus(422);

        VideoTest::create(['project_id' => $projectId]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::videoAnnotationsCsvId(),
            ])
            ->assertStatus(200);
    }

    public function testStoreOnlyLabels()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::first()->id;
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [999],
            ])
            ->assertStatus(422);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [$label->id],
            ])
            ->assertStatus(200);
    }
}
