<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\LabelTest;

class ProjectReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();

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

    public function testStoreNoImageVolumes()
    {
        $projectId = $this->project()->id;
        $this->volume(['media_type_id' => MediaType::videoId()]);
        $this->beGuest();
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageAnnotationsBasicId(),
            ])
            ->assertStatus(422);
    }

    public function testStoreNoVideoVolumes()
    {
        $projectId = $this->project()->id;
        $this->volume();
        $this->beGuest();
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::videoAnnotationsCsvId(),
            ])
            ->assertStatus(422);
    }

    public function testStoreVideoVolume()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume(['media_type_id' => MediaType::videoId()]);
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertArrayNotHasKey('exportArea', $report->options);
        $this->assertArrayNotHasKey('aggregateChildLabels', $report->options);
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
