<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\ExportFile;
use Biigle\Jobs\GenerateExportJob;
use Biigle\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class UserExportControllerTest extends ApiTestCase
{
    public function testRequestGenerateAndDownloadUserExport(): void
    {
        Queue::fake();
        Notification::fake();
        Storage::fake('test');
        config(['sync.export_storage_disk' => 'test']);
        $this->beGlobalAdmin();
        $this->user();
        $ids = User::pluck('id')->all();

        $this->postJson('/api/v1/export/users', ['except' => []])
            ->assertStatus(201)
            ->assertJson(['type' => 'users', 'entity_ids' => $ids, 'ready_at' => null]);

        $export = ExportFile::firstOrFail();
        Queue::assertPushed(GenerateExportJob::class);
        (new GenerateExportJob($export))->handle();

        Storage::disk('test')->assertExists("{$export->id}.zip");
        $zip = new ZipArchive;
        $zip->open(Storage::disk('test')->path("{$export->id}.zip"));
        $exportedIds = array_column(json_decode($zip->getFromName('users.json'), true), 'id');
        sort($exportedIds);
        sort($ids);
        $this->assertSame($ids, $exportedIds);
        $zip->close();

        $this->get("/api/v1/export/users/{$export->id}")
            ->assertStatus(200)
            ->assertHeader('content-disposition', 'attachment; filename=biigle_user_export.zip');
        $this->getJson("/api/v1/export/volumes/{$export->id}")->assertStatus(404);
    }
}
