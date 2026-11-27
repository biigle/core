<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Enums\Role;
use Biigle\ExportFile;
use Biigle\Tests\UserTest;
use Biigle\User;
use Storage;

class ExportFileControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $disk = Storage::fake('exports');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $disk->put($export->getStorageFilename(), 'archive');

        $this->doTestApiRoute('GET', "/api/v1/export-files/{$export->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(403);

        $this->be(UserTest::create(['role' => Role::ADMIN]));
        $this->getJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(403);

        $this->be($owner);
        $this->get("/api/v1/export-files/{$export->id}")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_volume_export.zip')
            ->assertStreamedContent('archive');
    }

    public function testShowPending()
    {
        Storage::fake('exports');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner);
        $this->be($owner);

        $this->getJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(404);
    }

    public function testShowFileMissing()
    {
        Storage::fake('exports');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $this->be($owner);

        $this->getJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(404);
    }

    public function testDestroy()
    {
        $disk = Storage::fake('exports');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $disk->put($export->getStorageFilename(), 'archive');

        $this->doTestApiRoute('DELETE', "/api/v1/export-files/{$export->id}");

        $this->beAdmin();
        $this->deleteJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(403);

        $this->be(UserTest::create(['role' => Role::ADMIN]));
        $this->deleteJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(403);

        $this->be($owner);
        $this->deleteJson("/api/v1/export-files/{$export->id}")
            ->assertStatus(200);

        $this->assertModelMissing($export);
        $disk->assertMissing($export->getStorageFilename());
    }

    public function testDestroyRedirect()
    {
        Storage::fake('exports');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner);
        $this->be($owner);

        $this->from('/search?t=exports')
            ->delete("/api/v1/export-files/{$export->id}")
            ->assertRedirect('/search?t=exports');

        $this->assertModelMissing($export);
    }

    protected function createExport(User $owner, $readyAt = null): ExportFile
    {
        $export = new ExportFile;
        $export->user()->associate($owner);
        $export->type = 'volumes';
        $export->entity_ids = [];
        $export->ready_at = $readyAt;
        $export->save();

        return $export;
    }
}
