<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Api;

use Response;
use ApiTestCase;
use Biigle\Tests\Modules\Export\ReportTest;

class ReportsControllerTest extends ApiTestCase
{
    public function testGet()
    {
        $report = ReportTest::create();

        $this->doTestApiRoute('GET', "api/v1/reports/{$report->id}");

        $this->beAdmin();
        $response = $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(403);

        $this->be($report->user);
        Response::shouldReceive('download')
            ->once()
            ->with($report->getPath(), $report->filename);

        Response::shouldReceive('json')->passthru();

        $response = $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(200);
    }
}
