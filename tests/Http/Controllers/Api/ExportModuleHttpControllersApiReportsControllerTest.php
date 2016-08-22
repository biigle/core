<?php

use Dias\Modules\Export\Jobs\Annotations\GenerateFullReport;
use Dias\Modules\Export\Jobs\Annotations\GenerateBasicReport;
use Dias\Modules\Export\Jobs\Annotations\GenerateExtendedReport;
use Dias\Modules\Export\Jobs\ImageLabels\GenerateStandardReport;

class ExportModuleHttpControllersApiReportsControllerTest extends ApiTestCase {

    public function testBasic() {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/basic")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateBasicReport::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/basic")
            ->assertResponseOk();
    }

    public function testExtended() {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/extended")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateExtendedReport::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/extended")
            ->assertResponseOk();
    }

    public function testFull() {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/full")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateFullReport::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/full")
            ->assertResponseOk();
    }

    public function testStoreImageLabelReport() {
        $id = $this->project()->id;

        $this->post("api/v1/projects/{$id}/reports/image-labels")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateStandardReport::class);
        $this->beGuest();
        $this->post("api/v1/projects/{$id}/reports/image-labels")
            ->assertResponseOk();
    }
}
