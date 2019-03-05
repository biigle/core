<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api;

use Storage;
use Response;
use ApiTestCase;
use Biigle\Tests\Modules\Reports\ReportTest;

class ReportsControllerTest extends ApiTestCase
{
    public function testGet()
    {
        $report = ReportTest::create();

        $this->doTestApiRoute('GET', "api/v1/reports/{$report->id}");

        $this->beAdmin();
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(403);

        $this->be($report->user);
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(404);

        Storage::fake(config('reports.storage_disk'));
        Storage::disk(config('reports.storage_disk'))->put($report->id, 'content');
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(200);
    }

    public function testDestroy()
    {
        $report = ReportTest::create();
        $this->doTestApiRoute('DELETE', "api/v1/reports/{$report->id}");

        $this->beAdmin();
        $this->json('DELETE', "api/v1/reports/{$report->id}")
            ->assertStatus(403);

        $this->be($report->user);
        $this->json('DELETE', "api/v1/reports/{$report->id}")
            ->assertStatus(200);

        $this->assertNull($report->fresh());
    }
}
