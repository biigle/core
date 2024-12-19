<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Sync\Support\Export\PublicLabelTreeExport;
use Biigle\Modules\Sync\Support\Import\PublicLabelTreeImport;
use Biigle\Role;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\UserTest;
use Biigle\User;
use Biigle\Visibility;
use Exception;
use File;
use Ramsey\Uuid\Uuid;
use TestCase;
use ZipArchive;

class PublicLabelTreeImportTest extends TestCase
{
    protected $destination;

    public function setUp(): void
    {
        parent::setUp();

        $this->labelTree = LabelTreeTest::create();
        $this->labelParent = LabelTest::create(['label_tree_id' => $this->labelTree->id]);
        $this->labelChild = LabelTest::create(['label_tree_id' => $this->labelTree->id, 'parent_id' => $this->labelParent->id]);
        $this->user = UserTest::create();
        $this->labelTree->addMember($this->user, Role::admin());
        $this->member = UserTest::create();
        $this->labelTree->addMember($this->member, Role::editor());
    }

    public function tearDown(): void
    {
        File::deleteDirectory($this->destination);
        parent::tearDown();
    }

    public function testFilesMatch()
    {
        $import = $this->getDefaultImport();

        $this->assertTrue($import->filesMatch());
        File::move("{$this->destination}/label_tree.json", "{$this->destination}/label_tree.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/label_tree.doge", "{$this->destination}/label_tree.json");
        File::move("{$this->destination}/labels.csv", "{$this->destination}/labels.doge");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = $this->getDefaultImport();
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/label_tree.json"), true);
        unset($content['uuid']);
        File::put("{$this->destination}/label_tree.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('are missing keys: uuid', $e->getMessage());
        }
    }

    public function testTreeExists()
    {
        $import = $this->getDefaultImport();
        $this->assertTrue($import->treeExists());
        $this->labelTree->delete();
        $this->assertFalse($import->treeExists());
    }

    public function testPerform()
    {
        $import = $this->getDefaultImport();
        $tree = $import->perform();
        $this->assertEquals(2, LabelTree::count());
        $this->assertEquals($this->labelTree->name, $tree->name);
        $this->assertEquals($this->labelTree->description, $tree->description);
        $this->assertEquals(Visibility::privateId(), $tree->visibility_id);
        $this->assertNotEquals($this->labelTree->id, $tree->id);
        $this->assertNotEquals($this->labelTree->uuid, $tree->uuid);
    }

    public function testPerformLabels()
    {
        $import = $this->getDefaultImport();
        $tree = $import->perform();
        $newParent = $tree->labels()->where('name', $this->labelParent->name)->first();
        $this->assertNotNull($newParent);
        $this->assertEquals($this->labelParent->name, $newParent->name);
        $this->assertEquals($this->labelParent->color, $newParent->color);
        $newChild = $tree->labels()->where('name', $this->labelChild->name)->first();
        $this->assertNotNull($newChild);
        $this->assertEquals($this->labelChild->name, $newChild->name);
        $this->assertEquals($this->labelChild->color, $newChild->color);
        $this->assertEquals($newChild->parent_id, $newParent->id);
    }

    protected function getDefaultImport()
    {
        return $this->getImport([$this->labelTree->id]);
    }

    protected function getImport(array $ids)
    {
        $export = new PublicLabelTreeExport($ids);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'label_tree_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();

        return new PublicLabelTreeImport($this->destination);
    }
}
