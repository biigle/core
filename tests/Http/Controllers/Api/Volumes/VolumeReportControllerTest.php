<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Modules\Reports\ReportType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;

class VolumeReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::first()->id;

        $this->doTestApiRoute('POST', "api/v1/volumes/{$volumeId}/reports");

        $this->beUser();
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);
        $this->assertEquals(false, $report->options['newestLabel']);

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
        $this->assertEquals(true, $report->options['newestLabel']);
    }

    public function testStoreVideoAnnotations()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/volumes/{$volumeId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }
}
