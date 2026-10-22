<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\ExportFile;
use Biigle\Jobs\GenerateExportJob;
use Biigle\Tests\LabelTreeTest;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class LabelTreeExportControllerTest extends ApiTestCase
{
    public function testRequestGenerateAndDownloadLabelTreeExport(): void
    {
        Queue::fake();
        Notification::fake();
        Storage::fake('test');
        config(['sync.export_storage_disk' => 'test']);
        $tree = LabelTreeTest::create();
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/label-trees', ['only' => [$tree->id]])
            ->assertStatus(201)
            ->assertJson(['type' => 'labelTrees', 'entity_ids' => [$tree->id], 'ready_at' => null]);

        $export = ExportFile::firstOrFail();
        Queue::assertPushed(GenerateExportJob::class);
        (new GenerateExportJob($export))->handle();

        Storage::disk('test')->assertExists("{$export->id}.zip");
        $zip = new ZipArchive;
        $zip->open(Storage::disk('test')->path("{$export->id}.zip"));
        $this->assertSame([$tree->id], array_column(json_decode($zip->getFromName('label_trees.json'), true), 'id'));
        $zip->close();

        $this->get("/api/v1/export/label-trees/{$export->id}")
            ->assertStatus(200)
            ->assertHeader('content-disposition', 'attachment; filename=biigle_label_tree_export.zip');
        $this->getJson("/api/v1/export/users/{$export->id}")->assertStatus(404);
    }
}
