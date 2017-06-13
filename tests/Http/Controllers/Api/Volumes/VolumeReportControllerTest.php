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
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertResponseStatus(403);

        $this->beGuest();
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertResponseStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'exportArea' => true,
            ])
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
