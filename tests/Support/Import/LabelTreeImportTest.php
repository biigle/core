<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;

class LabelTreeImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();

        $labelTree = LabelTreeTest::create();
        $export = new LabelTreeExport([$labelTree->id]);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'label_tree_import_test');
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
        $import = new LabelTreeImport($this->destination);

        $this->assertTrue($import->filesMatch());
        File::move("{$this->destination}/label_trees.json", "{$this->destination}/label_trees.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/label_trees.doge", "{$this->destination}/label_trees.json");
        File::move("{$this->destination}/users.json", "{$this->destination}/users.doge");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = new LabelTreeImport($this->destination);
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/label_trees.json"), true);
        unset($content[0]['uuid']);
        File::put("{$this->destination}/label_trees.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertContains('are missing keys: uuid', $e->getMessage());
        }
    }
}
