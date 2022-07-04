<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\Modules\Reports\ReportTest;
use Response;
use Storage;

class ReportsControllerTest extends ApiTestCase
{
    public function testGet()
    {
        config(['reports.storage_disk' => 'test']);
        $report = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
        ]);

        $this->doTestApiRoute('GET', "api/v1/reports/{$report->id}");

        $this->beAdmin();
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(403);

        $this->be($report->user);
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(404);

        $disk = Storage::fake('test');
        $disk->put($report->getStorageFilename(), 'content');
        $this->json('GET', "api/v1/reports/{$report->id}")
            ->assertStatus(200);
    }

    public function testDestroy()
    {
        config(['reports.storage_disk' => null]);
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
