<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Videos;

use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\VideoTest;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

class VideoReportControllerTest extends ApiTestCase
{
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

    public function testStoreOnlyLabels()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $videoId = VideoTest::create(['project_id' => $this->project()->id])->id;
        $typeId = ReportType::videoAnnotationsCsvId();
        $this->postJson("api/v1/videos/{$videoId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [999],
            ])
            ->assertStatus(422);

        $this->postJson("api/v1/videos/{$videoId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [$label->id],
            ])
            ->assertStatus(200);
    }
}
