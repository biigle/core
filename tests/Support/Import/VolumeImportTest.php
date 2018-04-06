<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;

class VolumeImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();

        $volume = VolumeTest::create();
        $export = new VolumeExport([$volume->id]);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'volume_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();
    }

    public function tearDown()
    {
        File::deleteDirectory($this->destination);
        parent::tearDown();
    }

    public function testFilesMatch()
    {
        $import = new VolumeImport($this->destination);

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
        $import = new VolumeImport($this->destination);
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
}
