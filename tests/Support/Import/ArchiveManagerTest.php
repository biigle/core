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
use Biigle\Modules\Sync\Support\Export\PublicLabelTreeExport;

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

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/users.json'));
        } finally {
            File::deleteDirectory($path);
        }
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
            $this->assertContains('User imports are not allowed', $e->getMessage());
        }
    }

    public function testStoreLabelTreeExport()
    {
        $tree = LabelTreeTest::create();
        $export = new LabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/label_trees.json'));
        } finally {
            File::deleteDirectory($path);
        }
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
            $this->assertContains('Label tree imports are not allowed', $e->getMessage());
        }
    }

    public function testStoreVolumeExport()
    {
        $volume = VolumeTest::create();
        $export = new VolumeExport([$volume->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_volume_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/volumes.json'));
        } finally {
            File::deleteDirectory($path);
        }
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
            $this->assertContains('Volume imports are not allowed', $e->getMessage());
        }
    }

    public function testStorePublicLabelTreeExport()
    {
        $tree = LabelTreeTest::create();
        $export = new PublicLabelTreeExport([$tree->id]);
        $path = $export->getArchive();

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        $token = (new ArchiveManager)->store($file);
        $path = config('sync.import_storage')."/{$token}";
        try {
            $this->assertTrue(File::isDirectory($path));
            $this->assertTrue(File::exists($path.'/label_tree.json'));
        } finally {
            File::deleteDirectory($path);
        }
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

        $file = new UploadedFile($path, 'biigle_label_tree_export.zip', 'application/zip', null, true);

        try {
            $token = (new ArchiveManager)->store($file);
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

        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $manager = new ArchiveManager;
        $token = $manager->store($file);
        $path = config('sync.import_storage')."/{$token}";

        $manager->prune();
        $this->assertTrue(File::exists($path));
        touch($path, Carbon::now()->subDays(8)->getTimestamp());
        $manager->prune();
        $this->assertFalse(File::exists($path));
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
