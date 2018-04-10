<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;

class LabelTreeImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();

        $this->labelTree = LabelTreeTest::create();
        $this->labelParent = LabelTest::create(['label_tree_id' => $this->labelTree->id]);
        $this->labelChild = LabelTest::create(['label_tree_id' => $this->labelTree->id, 'parent_id' => $this->labelParent->id]);
        $export = new LabelTreeExport([$this->labelTree->id]);
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

    public function testGetImportLabelTrees()
    {
        $import = new LabelTreeImport($this->destination);
        $trees = $import->getImportLabelTrees();
        $this->assertCount(1, $trees);
        $this->assertEquals($this->labelTree->name, $trees[0]['name']);
    }

    public function testGetLabelTreeImportCandidates()
    {
        $import = new LabelTreeImport($this->destination);
        $this->assertCount(0, $import->getLabelTreeImportCandidates());
        $this->labelTree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($this->labelTree->name, $trees[0]['name']);
    }

    public function testGetLabelImportCandidates()
    {
        $import = new LabelTreeImport($this->destination);
        $this->assertCount(0, $import->getLabelImportCandidates());
        $this->labelChild->delete();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($this->labelChild->name, $labels[0]['name']);
        $this->assertFalse(array_key_exists('conflicting_name', $labels[0]));
        $this->assertFalse(array_key_exists('conflicting_parent_id', $labels[0]));
        $this->assertCount(0, $import->getLabelTreeImportCandidates());
        $this->labelTree->delete();
        // Only return labels of existing label trees.
        $this->assertCount(0, $import->getLabelImportCandidates());
    }

    public function testGetLabelImportCandidatesNameConflict()
    {
        $import = new LabelTreeImport($this->destination);
        $this->assertCount(0, $import->getLabelImportCandidates());
        $this->labelParent->name = 'conflicting name';
        $this->labelParent->save();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($this->labelParent->id, $labels[0]['id']);
        $this->assertEquals('conflicting name', $labels[0]['conflicting_name']);
        $this->assertFalse(array_key_exists('conflicting_parent_id', $labels[0]));
    }

    public function testGetLabelImportCandidatesParentConflict()
    {
        $import = new LabelTreeImport($this->destination);
        $this->assertCount(0, $import->getLabelImportCandidates());
        $this->labelChild->parent_id = null;
        $this->labelChild->save();
        $labels = $import->getLabelImportCandidates();
        $this->assertCount(1, $labels);
        $this->assertEquals($this->labelChild->id, $labels[0]['id']);
        $this->assertNull($labels[0]['conflicting_parent_id']);
        $this->assertFalse(array_key_exists('conflicting_name', $labels[0]));
    }

    public function testPerform()
    {
        $this->markTestIncomplete();
    }
}
