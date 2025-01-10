<?php

namespace Biigle\Tests\Services\Import;

use Biigle\Services\Export\LabelTreeExport;
use Biigle\Services\Export\PublicLabelTreeExport;
use Biigle\Services\Export\UserExport;
use Biigle\Services\Export\VolumeExport;
use Biigle\Services\Import\ArchiveManager;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Carbon\Carbon;
use Exception;
use File;
use Illuminate\Http\UploadedFile;
use Storage;
use TestCase;
use ZipArchive;

class ArchiveManagerTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['sync.import_storage_disk' => 'test']);
        Storage::fake('test');
    }

    public function testStoreUserExport()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $this->assertTrue(Storage::disk('test')->has($token));
    }

    public function testStoreUserExportNotAllowed()
    {
        config(['sync.allowed_imports' => ['volumes', 'labelTrees']]);
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        try {
            $token = (new ArchiveManager)->store($file);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('User imports are not allowed', $e->getMessage());
            $this->assertEmpty(Storage::disk('test')->listContents('/')->toArray());
        }
    }

    public function testStoreLabelTreeExport()
    {
        $tree = LabelTreeTest::create();
        $export = new LabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $this->assertTrue(Storage::disk('test')->has($token));
    }

    public function testStoreLabelTreeExportNotAllowed()
    {
        config(['sync.allowed_imports' => ['volumes', 'users']]);
        $tree = LabelTreeTest::create();
        $export = new LabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        try {
            $token = (new ArchiveManager)->store($file);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Label tree imports are not allowed', $e->getMessage());
            $this->assertEmpty(Storage::disk('test')->listContents('/')->toArray());
        }
    }

    public function testStoreVolumeExport()
    {
        $volume = VolumeTest::create();
        $export = new VolumeExport([$volume->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_volume_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $this->assertTrue(Storage::disk('test')->has($token));
    }

    public function testStoreVolumeExportNotAllowed()
    {
        config(['sync.allowed_imports' => ['labelTrees', 'users']]);
        $volume = VolumeTest::create();
        $export = new VolumeExport([$volume->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_volume_export.zip', 'application/zip', null, true);

        try {
            $token = (new ArchiveManager)->store($file);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Volume imports are not allowed', $e->getMessage());
            $this->assertEmpty(Storage::disk('test')->listContents('/')->toArray());
        }
    }

    public function testStorePublicLabelTreeExport()
    {
        $tree = LabelTreeTest::create();
        $export = new PublicLabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $this->assertTrue(Storage::disk('test')->has($token));
    }

    public function testStoreInvalidArchive()
    {
        $path = tempnam(sys_get_temp_dir(), 'corrupt_zip');
        File::put($path, 'abc123');
        $file = new UploadedFile($path, 'biigle_volume_export.zip', 'application/zip', null, true);

        try {
            (new ArchiveManager)->store($file);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Could not open import archive', $e->getMessage());
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

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        try {
            $token = (new ArchiveManager)->store($file);
            $this->assertTrue(false);
        } catch (Exception $e) {
            $this->assertStringContainsString('not a valid import archive', $e->getMessage());
        }
    }

    public function testPrune()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $manager = new ArchiveManager;
        $token = $manager->store($file);
        $path = storage_path("framework/testing/disks/test/{$token}");

        $manager->prune();
        $this->assertTrue($manager->has($token));
        touch($path, Carbon::now()->subDays(8)->getTimestamp());
        $manager->prune();
        $this->assertFalse($manager->has($token));
    }

    public function testHas()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $manager = new ArchiveManager;
        $token = $manager->store($file);
        $this->assertTrue($manager->has($token));
        $this->assertFalse($manager->has('abc123'));
    }

    public function testDelete()
    {
        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $manager = new ArchiveManager;
        $token = $manager->store($file);
        $this->assertTrue($manager->has($token));
        $manager->delete($token);
        $this->assertFalse($manager->has($token));
        $manager->delete('abc123');
    }
}
