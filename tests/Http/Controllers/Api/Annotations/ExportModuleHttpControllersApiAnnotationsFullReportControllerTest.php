<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;

class ExportModuleHttpControllersApiAnnotationsFullReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/annotations/full")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/annotations/full")
            ->assertResponseOk();
    }
}
