<?php

namespace Dias\Tests\Modules\Export\Http\Controllers\Api\Transects\ImageLabels;

use ApiTestCase;
use Dias\Modules\Export\Jobs\GenerateReportJob;

class BasicReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->transect()->id;

        $this->post("api/v1/transects/{$id}/reports/image-labels/basic")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/transects/{$id}/reports/image-labels/basic")
            ->assertResponseOk();
    }
}
