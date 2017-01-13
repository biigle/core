<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Volumes\ImageLabels;

use ApiTestCase;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

class BasicReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->volume()->id;

        $this->post("api/v1/volumes/{$id}/reports/image-labels/basic")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/volumes/{$id}/reports/image-labels/basic")
            ->assertResponseOk();
    }
}
