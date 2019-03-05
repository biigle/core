<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

class VideoReportControllerTest extends ApiTestCase
{
    public function setUp()
    {
        parent::setUp();
        if (!class_exists(VideoTest::class)) {
            $this->markTestSkipped('Requires the biigle/videos module.');
        }
    }

    public function testStore()
    {
        $videoId = VideoTest::create(['project_id' => $this->project()->id])->id;
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->doTestApiRoute('POST', "api/v1/videos/{$videoId}/reports");

        $this->beUser();
        $response = $this->json('POST', "api/v1/videos/{$videoId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/videos/{$videoId}/reports")
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $response = $this->json('POST', "api/v1/videos/{$videoId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($videoId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);
        $this->assertEquals(false, $report->options['newestLabel']);

        $response = $this->json('POST', "api/v1/videos/{$videoId}/reports", [
                'type_id' => $typeId,
                'separate_label_trees' => true,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($videoId, $report->source_id);
        $this->assertEquals(true, $report->options['separateLabelTrees']);
    }

    public function testStoreVolumeAnnotations()
    {
        $videoId = VideoTest::create(['project_id' => $this->project()->id])->id;
        $typeId = ReportType::annotationsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/videos/{$videoId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }
}
