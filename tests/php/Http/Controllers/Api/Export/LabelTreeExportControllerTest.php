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
    public function testStoreAndGenerate(): void
    {
        Queue::fake();
        Notification::fake();
        Storage::fake('exports');
        $tree = LabelTreeTest::create();
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/label-trees', ['only' => [$tree->id]])
            ->assertStatus(201)
            ->assertJson(['type' => 'labelTrees', 'entity_ids' => [$tree->id], 'ready_at' => null]);

        $export = ExportFile::firstOrFail();
        Queue::assertPushed(GenerateExportJob::class);
        (new GenerateExportJob($export))->handle();

        Storage::disk('exports')->assertExists("{$export->id}.zip");
        $zip = new ZipArchive;
        $zip->open(Storage::disk('exports')->path("{$export->id}.zip"));
        $this->assertSame([$tree->id], array_column(json_decode($zip->getFromName('label_trees.json'), true), 'id'));
        $zip->close();
    }
}
