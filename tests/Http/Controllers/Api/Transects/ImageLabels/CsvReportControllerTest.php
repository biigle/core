<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api\Transects\ImageLabels;

use ApiTestCase;
use Biigle\Modules\Export\Jobs\GenerateReportJob;

class CsvReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->transect()->id;

        $this->post("api/v1/transects/{$id}/reports/image-labels/csv")
            ->assertResponseStatus(401);

        $this->expectsJobs(GenerateReportJob::class);
        $this->beGuest();
        $this->post("api/v1/transects/{$id}/reports/image-labels/csv")
            ->assertResponseOk();
    }
}
