<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;

class VolumeImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();
        $this->volume = VolumeTest::create();
        $this->image = ImageTest::create(['volume_id' => $this->volume->id]);
    }

    public function tearDown()
    {
        File::deleteDirectory($this->destination);
        parent::tearDown();
    }

    public function testFilesMatch()
    {
        $import = $this->getDefaultImport();

        $this->assertTrue($import->filesMatch());
        File::move("{$this->destination}/volumes.json", "{$this->destination}/volumes.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/volumes.doge", "{$this->destination}/volumes.json");
        File::move("{$this->destination}/label_trees.json", "{$this->destination}/label_trees.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/label_trees.doge", "{$this->destination}/label_trees.json");
        File::move("{$this->destination}/users.json", "{$this->destination}/users.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/users.doge", "{$this->destination}/users.json");
        File::move("{$this->destination}/images.csv", "{$this->destination}/images.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/images.doge", "{$this->destination}/images.csv");
        File::move("{$this->destination}/annotations.csv", "{$this->destination}/annotations.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/annotations.doge", "{$this->destination}/annotations.csv");
        File::move("{$this->destination}/annotation_labels.csv", "{$this->destination}/annotation_labels.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/annotation_labels.doge", "{$this->destination}/annotation_labels.csv");
        File::move("{$this->destination}/image_labels.csv", "{$this->destination}/image_labels.doge");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = $this->getDefaultImport();
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/volumes.json"), true);
        unset($content[0]['url']);
        File::put("{$this->destination}/volumes.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains('are missing keys: url', $e->getMessage());
        }
    }

    public function testGetImportVolumes()
    {
        $import = $this->getDefaultImport();
        $volumes = $import->getImportVolumes();
        $this->assertCount(1, $volumes);
        $this->assertEquals($this->volume->name, $volumes[0]['name']);
    }

    public function testGetUserImportCandidatesLabelTree()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $tree = $imageLabel->label->tree;
        $admin = UserTest::create();
        $tree->addMember($admin, Role::$admin);
        $admin2 = UserTest::create();
        $tree->addMember($admin2, Role::$admin);
        $editor = UserTest::create();
        $tree->addMember($editor, Role::$editor);

        $import = $this->getDefaultImport();
        $admin2->delete();

        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $volumeUsers = $users->get($this->volume->id);
        $this->assertEquals($admin2->uuid, $volumeUsers[0]['uuid']);
    }

    public function testGetUserImportCandidatesAnnotationLabel()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'annotation_id' => AnnotationTest::create(['image_id' => $this->image->id])->id,
        ]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $annotationLabel->user->fresh()->uuid;
        $annotationLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users->get($this->volume->id)[0]['uuid']);
    }

    public function testGetUserImportCandidatesImageLabel()
    {
        $imageLabel = ImageLabelTest::create(['image_id' => $this->image->id]);
        $import = $this->getDefaultImport();
        $users = $import->getUserImportCandidates();
        $this->assertCount(0, $users);
        $uuid = $imageLabel->user->fresh()->uuid;
        $imageLabel->user->delete();
        $users = $import->getUserImportCandidates();
        $this->assertCount(1, $users);
        $this->assertEquals($uuid, $users->get($this->volume->id)[0]['uuid']);
    }

    protected function getDefaultImport()
    {
        return $this->getImport([$this->volume->id]);
    }

    protected function getImport(array $ids)
    {
        $export = new VolumeExport($ids);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'volume_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();

        return new VolumeImport($this->destination);
    }
}
