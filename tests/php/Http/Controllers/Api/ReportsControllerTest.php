<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\ReportType;
use Biigle\Tests\ReportTest;
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

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/reports');

        $this->beUser();
        $response = $this->get('/api/v1/reports');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }
}
