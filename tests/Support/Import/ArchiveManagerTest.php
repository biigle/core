<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Carbon\Carbon;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\LabelTreeTest;
use Illuminate\Http\UploadedFile;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;

class ArchiveManagerTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        config(['sync.import_storage' => sys_get_temp_dir()]);
    }

    public function testStoreUserExport()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        $token = $manager->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/users.json'));
        } finally {
            File::deleteDirectory($path);
        }
    }

    public function testStoreLabelTreeExport()
    {
        $tree = LabelTreeTest::create();
        $export = new LabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        $token = $manager->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/label_trees.json'));
        } finally {
            File::deleteDirectory($path);
        }
    }

    public function testStoreVolumeExport()
    {
        $volume = VolumeTest::create();
        $export = new VolumeExport([$volume->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_volume_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        $token = $manager->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/volumes.json'));
        } finally {
            File::deleteDirectory($path);
        }
    }

    public function testStoreInvalidArchive()
    {
        $path = tempnam(sys_get_temp_dir(), 'corrupt_zip');
        File::put($path, 'abc123');
        $file = new UploadedFile($path, 'biigle_volume_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        try {
            $manager->store($file);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains('Could not open import archive', $e->getMessage());
        } finally {
            File::delete($path);
        }
    }

    public function testStoreInvalidExport()
    {
        $tree = LabelTreeTest::create();
        $export = new LabelTreeExport([$tree->id]);
        $path = $export->getArchive();
        $zip = new ZipArchive;
        $zip->open($path);
        $zip->deleteName('users.json');
        $zip->close();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        try {
            $token = $manager->store($file);
            $this->assertTrue(false);
        } catch (Exception $e) {
            $this->assertContains('not a valid import archive', $e->getMessage());
        }
    }

    public function testPrune()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', filesize($path), 'application/zip', null, true);
        $manager = new ArchiveManager;

        $token = $manager->store($file);
        $path = config('sync.import_storage')."/{$token}";

        $manager->prune();
        $this->assertTrue(File::exists($path));
        touch($path, Carbon::now()->subDays(8)->getTimestamp());
        $manager->prune();
        $this->assertFalse(File::exists($path));
    }
}
