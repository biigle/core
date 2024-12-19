<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Illuminate\Http\UploadedFile;
use Storage;

class ImportAdminControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['sync.import_storage_disk' => 'test']);
        Storage::fake('test');
    }

    public function testIndex()
    {
        $this->beAdmin();
        $this->get('admin/import')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->get('admin/import')->assertStatus(200);
        $this->get('admin')->assertSee('Import');
    }

    public function testShowUserImport()
    {
        $this->beAdmin();
        $this->get('admin/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->get('admin/import/abc123')->assertStatus(404);

        $export = new UserExport([]);
        $path = $export->getArchive();
        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);
        $manager = new ArchiveManager;
        $token = $manager->store($file);

        $this->get("admin/import/{$token}")
            ->assertStatus(200)
            ->assertViewIs('sync::import.showUser');
    }

    public function testShowLabelTreeImport()
    {
        $this->beAdmin();
        $this->get('admin/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->get('admin/import/abc123')->assertStatus(404);

        $export = new LabelTreeExport([]);
        $path = $export->getArchive();
        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);
        $manager = new ArchiveManager;
        $token = $manager->store($file);

        $this->get("admin/import/{$token}")
            ->assertStatus(200)
            ->assertViewIs('sync::import.showLabelTree');
    }

    public function testShowVolumeImport()
    {
        $this->beAdmin();
        $this->get('admin/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->get('admin/import/abc123')->assertStatus(404);

        $export = new VolumeExport([]);
        $path = $export->getArchive();
        $file = new UploadedFile($path, 'biigle_volume_export.zip', 'application/zip', null, true);
        $manager = new ArchiveManager;
        $token = $manager->store($file);

        $this->get("admin/import/{$token}")
            ->assertStatus(200)
            ->assertViewIs('sync::import.showVolume');
    }
}
