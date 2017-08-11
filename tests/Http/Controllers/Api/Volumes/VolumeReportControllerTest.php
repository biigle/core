<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Modules\Export\ReportType;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

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
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
