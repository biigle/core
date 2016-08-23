<?php

use Dias\Modules\Export\Jobs\GenerateReportJob;

class ExportModuleHttpControllersApiExtendedAnnotationReportControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/extended")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/extended")
            ->assertResponseOk();
    }
}
