<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;

class ExportModuleHttpControllersApiImageLabelReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/image-labels")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/image-labels")
            ->assertResponseOk();
    }
}
