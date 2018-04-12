<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Role;
use Biigle\User;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Visibility;
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
        $this->user = UserTest::create();
        $this->labelTree->addMember($this->user, Role::$admin);
        $this->member = UserTest::create();
        $this->labelTree->addMember($this->member, Role::$editor);
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
        $this->assertEquals($this->labelTree->name, $labels[0]['label_tree_name']);
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

    public function gestGetUserImportCandidates()
    {
        $import = new LabelTreeImport($this->destination);
        $this->assertCount(0, $import->getUserImportCandidates());
        $this->user->delete();
        $this->assertCount(1, $import->getUserImportCandidates());
    }

    public function testPerformNothing()
    {
        $import = new LabelTreeImport($this->destination);
        $expect = [
            'labelTrees' => [$this->labelTree->id => $this->labelTree->id],
            'labels' => [
                $this->labelParent->id => $this->labelParent->id,
                $this->labelChild->id => $this->labelChild->id,
            ],
            'users' => [
                $this->user->id => $this->user->id,
                $this->member->id => $this->member->id,
            ],
        ];
        $this->assertEquals($expect, $import->perform());
    }

    public function testPerformTrees()
    {
        $import = new LabelTreeImport($this->destination);
        $this->labelTree->delete();
        $map = $import->perform();

        $newTree = LabelTree::orderByDesc('id')->first();
        $expect = [$this->labelTree->id => $newTree->id];
        $this->assertEquals($expect, $map['labelTrees']);
        $this->assertEquals($this->labelTree->uuid, $newTree->uuid);
        $this->assertEquals($this->labelTree->name, $newTree->name);
        $this->assertEquals($this->labelTree->description, $newTree->description);
        $this->assertEquals(Visibility::$private->id, $newTree->visibility_id);

        $parent = $newTree->labels()->whereNull('parent_id')->first();
        $child = $newTree->labels()->whereNotNull('parent_id')->first();
        $this->assertEquals($parent->id, $child->parent_id);
        $expect = [
            $this->labelParent->id => $parent->id,
            $this->labelChild->id => $child->id,
        ];
        $this->assertEquals($expect, $map['labels']);

        $members = $newTree->members()
            ->addSelect('uuid')
            ->get()
            // Pluck after get to get the correct role_id.
            ->pluck('role_id', 'uuid')
            ->toArray();

        $expect = [
            $this->user->uuid => Role::$admin->id,
            $this->member->uuid => Role::$editor->id,
        ];
        $this->assertEquals($expect, $members);
        $this->assertCount(2, $map['users']);
    }

    public function testPerformLabels()
    {
        $import = new LabelTreeImport($this->destination);
        $this->labelChild->delete();
        $map = $import->perform();
        $newLabel = Label::orderByDesc('id')->first();
        $expect = [
            $this->labelChild->id => $newLabel->id,
            $this->labelParent->id => $this->labelParent->id,
        ];
        $this->assertEquals($expect, $map['labels']);
        $this->assertEquals($this->labelChild->uuid, $newLabel->uuid);
        $this->assertEquals($this->labelChild->name, $newLabel->name);
        $this->assertEquals($this->labelChild->parent_id, $newLabel->parent_id);
        $this->assertEquals($this->labelChild->color, $newLabel->color);
    }

    public function testPerformMembers()
    {
        $import = new LabelTreeImport($this->destination);
        // Do not import label tree editors if they do not exist.
        $this->member->delete();
        $map = $import->perform();
        $newTree = LabelTree::orderByDesc('id')->first();
        $this->assertEquals(1, $newTree->members()->count());
        $this->assertFalse(User::where('uuid', $this->member->uuid)->exists());

        $newTree->delete();
        // *Do* import label tree admins if they do not exist.
        $this->user->delete();
        $map = $import->perform();
        $newTree = LabelTree::orderByDesc('id')->first();
        $this->assertEquals(1, $newTree->members()->count());
        $this->assertTrue(User::where('uuid', $this->user->uuid)->exists());
    }

    public function testPerformOnlyTrees()
    {
        $this->markTestIncomplete();
    }

    public function testPerformOnlyLabels()
    {
        $this->markTestIncomplete();
    }

    public function testPerformNameConflicts()
    {
        $this->markTestIncomplete();
    }

    public function testPerformParentConflicts()
    {
        $this->markTestIncomplete();
    }

    public function testPerformUserConflicts()
    {
        $this->markTestIncomplete();
        // Perform the user import first so it may fail before labels/trees are created.
    }
}
