<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Modules\Export\ReportType;
use Biigle\Modules\Export\Jobs\GenerateReportJob;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\AreaReport;

class VolumeReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->volume()->id;
        $tid = ReportType::first()->id;

        $this->post("api/v1/volumes/{$id}/reports/{$tid}")
            ->assertResponseStatus(401);
    }

    public function testStoreReports()
    {
        foreach (ReportType::pluck('id') as $tid) {
            $this->storeReport($tid);
        }
    }

    protected function storeReport($tid)
    {
        $id = $this->volume()->id;

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/volumes/{$id}/reports/{$tid}")
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($tid, $report->type_id);
        $this->assertEquals($id, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);

        $this->post("api/v1/volumes/{$id}/reports/{$tid}", ['exportArea' => true])
            ->assertResponseOk();

        $job = end($this->dispatchedJobs);
        $report = $job->report;
        $this->assertEquals($tid, $report->type_id);
        $this->assertEquals($id, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
    }
}
