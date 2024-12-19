<?php

namespace Biigle\Tests\Services\Import;

use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Services\Export\LabelTreeExport;
use Biigle\Services\Import\LabelTreeImport;
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

class LabelTreeImportTest extends TestCase
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
        File::move("{$this->destination}/label_trees.json", "{$this->destination}/label_trees.doge");
        $this->assertFalse($import->filesMatch());
        File::move("{$this->destination}/label_trees.doge", "{$this->destination}/label_trees.json");
        File::move("{$this->destination}/users.json", "{$this->destination}/users.doge");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = $this->getDefaultImport();
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/label_trees.json"), true);
        unset($content[0]['uuid']);
        File::put("{$this->destination}/label_trees.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('are missing keys: uuid', $e->getMessage());
        }
    }

    public function testGetImportLabelTrees()
    {
        $import = $this->getDefaultImport();
        $trees = $import->getImportLabelTrees();
        $this->assertCount(1, $trees);
        $this->assertEquals($this->labelTree->name, $trees[0]['name']);
    }

    public function testGetLabelTreeImportCandidates()
    {
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getLabelTreeImportCandidates());
        $this->labelTree->delete();
        $trees = $import->getLabelTreeImportCandidates();
        $this->assertCount(1, $trees);
        $this->assertEquals($this->labelTree->name, $trees[0]['name']);
    }

    public function testGetLabelImportCandidates()
    {
        $import = $this->getDefaultImport();
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
        $import = $this->getDefaultImport();
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
        $import = $this->getDefaultImport();
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
        $import = $this->getDefaultImport();
        $this->assertCount(0, $import->getUserImportCandidates());
        $this->user->delete();
        $this->assertCount(1, $import->getUserImportCandidates());
    }

    public function testPerformNothing()
    {
        $import = $this->getDefaultImport();
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
        $import = $this->getDefaultImport();
        $this->labelTree->delete();
        $map = $import->perform();

        $newTree = LabelTree::orderByDesc('id')->first();
        $expect = [$this->labelTree->id => $newTree->id];
        $this->assertEquals($expect, $map['labelTrees']);
        $this->assertEquals($this->labelTree->uuid, $newTree->uuid);
        $this->assertEquals($this->labelTree->name, $newTree->name);
        $this->assertEquals($this->labelTree->description, $newTree->description);
        $this->assertEquals(Visibility::privateId(), $newTree->visibility_id);

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
            $this->user->uuid => Role::adminId(),
            $this->member->uuid => Role::editorId(),
        ];
        $this->assertEquals($expect, $members);
        $this->assertCount(2, $map['users']);
    }

    public function testPerformVersionedTrees()
    {
        $version = LabelTreeVersionTest::create();
        $this->labelTree->version_id = $version->id;
        $this->labelTree->save();
        $import = $this->getDefaultImport();
        // This also deletes $this->labelTree.
        $version->labelTree->delete();
        $map = $import->perform();
        $this->assertEquals(2, LabelTree::count());
        $newVersionedTree = LabelTree::whereNotNull('version_id')->first();
        $this->assertNotNull($newVersionedTree);
        $this->assertEquals($this->labelTree->uuid, $newVersionedTree->uuid);
        $this->assertEquals($version->labelTree->uuid, $newVersionedTree->version->labelTree->uuid);
    }

    public function testPerformVersionedTreesMasterExists()
    {
        $version = LabelTreeVersionTest::create();
        $masterTree = $version->labelTree;
        $this->labelTree->version_id = $version->id;
        $this->labelTree->save();
        $import = $this->getDefaultImport();
        // This also deletes $this->labelTree.
        $version->delete();
        $map = $import->perform();
        $this->assertEquals(2, LabelTree::count());
        $newVersionedTree = LabelTree::whereNotNull('version_id')->first();
        $this->assertNotNull($newVersionedTree);
        $this->assertEquals($this->labelTree->uuid, $newVersionedTree->uuid);
        $this->assertEquals($masterTree->id, $newVersionedTree->version->labelTree->id);
    }

    public function testPerformLabels()
    {
        $import = $this->getDefaultImport();
        $this->labelChild->delete();
        // Simulate different label IDs between the same import and existing label.
        $importParentId = $this->labelParent->id;
        $this->labelParent->id = 99999;
        $this->labelParent->save();
        $map = $import->perform();
        $newLabel = Label::orderBy('id', 'asc')->first();
        $expect = [
            $this->labelChild->id => $newLabel->id,
            $importParentId => $this->labelParent->id,
        ];
        $this->assertEquals($expect, $map['labels']);
        $this->assertEquals($this->labelChild->uuid, $newLabel->uuid);
        $this->assertEquals($this->labelChild->name, $newLabel->name);
        $this->assertEquals($this->labelParent->id, $newLabel->parent_id);
        $this->assertEquals($this->labelChild->color, $newLabel->color);
    }

    public function testPerformWithoutVersion()
    {
        $import = $this->getImport([$this->labelTree->id], LabelTreeImportWithoutVersionStub::class);
        $this->labelTree->delete();
        $map = $import->perform();
        $newTree = LabelTree::where('uuid', $this->labelTree->uuid)->first();
        $this->assertNotNull($newTree);
        $this->assertEquals(2, $newTree->labels()->count());
    }

    public function testPerformMembers()
    {
        $import = $this->getDefaultImport();
        $this->labelTree->delete();
        // Do not import label tree editors if they do not exist.
        $this->member->delete();
        $this->user->delete();
        $map = $import->perform();
        $newTree = LabelTree::orderByDesc('id')->first();
        $this->assertEquals(1, $newTree->members()->count());
        $this->assertFalse(User::where('uuid', $this->member->uuid)->exists());
    }

    public function testPerformOnlyTrees()
    {
        $otherTree = LabelTreeTest::create();
        $import = $this->getImport([$this->labelTree->id, $otherTree->id]);
        $otherTree->delete();
        $this->labelTree->delete();
        $map = $import->perform([$otherTree->id]);
        $this->assertTrue(LabelTree::where('uuid', $otherTree->uuid)->exists());
        $this->assertFalse(LabelTree::where('uuid', $this->labelTree->uuid)->exists());
        $this->assertFalse(array_key_exists($this->labelTree->id, $map['labelTrees']));
    }

    public function testPerformOnlyVersionedTrees()
    {
        $version = LabelTreeVersionTest::create();
        $this->labelTree->version_id = $version->id;
        $this->labelTree->save();
        $import = $this->getDefaultImport();
        // This also deletes $this->labelTree.
        $version->labelTree->delete();
        // The master label tree should be imported, too.
        $map = $import->perform([$this->labelTree->id]);
        $this->assertEquals(2, LabelTree::count());
        $newVersionedTree = LabelTree::whereNotNull('version_id')->first();
        $this->assertNotNull($newVersionedTree);
        $this->assertEquals($this->labelTree->uuid, $newVersionedTree->uuid);
        $this->assertEquals($version->labelTree->uuid, $newVersionedTree->version->labelTree->uuid);
    }

    public function testPerformOnlyLabels()
    {
        $import = $this->getDefaultImport();
        $this->labelParent->delete();
        $this->labelChild->delete();
        $map = $import->perform(null, [$this->labelChild->id]);
        $labels = $this->labelTree->labels;
        $this->assertCount(1, $labels);
        $this->assertEquals($this->labelChild->uuid, $labels[0]->uuid);
        $this->assertNull($labels[0]->parent_id);
    }

    public function testPerformOnlyLabelsAlthoughBelongsToTree()
    {
        $import = $this->getDefaultImport();
        $this->labelTree->delete();
        // Labels specified in $onlyLabels are ignored if they belong to a label tree
        // that should be imported completely.
        $map = $import->perform(null, [$this->labelChild->id]);
        $newTree = LabelTree::orderByDesc('id')->first();
        $this->assertEquals(2, $newTree->labels()->count());
    }

    public function testPerformNameConflictUnresoved()
    {
        $import = $this->getDefaultImport();
        $this->labelParent->name = 'some other name';
        $this->labelParent->save();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Unresolved name conflict', $e->getMessage());
        }
    }

    public function testPerformNameConflictTakeImport()
    {
        $import = $this->getDefaultImport();
        $originalName = $this->labelParent->name;
        $this->labelParent->name = 'some other name';
        $this->labelParent->save();
        $import->perform(null, null, [$this->labelParent->id => 'import']);
        $this->assertEquals($originalName, $this->labelParent->fresh()->name);
    }

    public function testPerformNameConflictTakeExisting()
    {
        $import = $this->getDefaultImport();
        $this->labelParent->name = 'some other name';
        $this->labelParent->save();
        $import->perform(null, null, [$this->labelParent->id => 'existing']);
        $this->assertEquals('some other name', $this->labelParent->fresh()->name);
    }

    public function testPerformParentConflictUnresolved()
    {
        $import = $this->getDefaultImport();
        $this->labelChild->parent_id = null;
        $this->labelChild->save();
        $this->labelParent->delete();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Unresolved parent conflict', $e->getMessage());
        }
    }

    public function testPerformParentConflictUnresolvedNewExisting()
    {
        $import = $this->getDefaultImport();
        $otherLabel = LabelTest::create(['label_tree_id' => $this->labelTree->id]);
        $this->labelParent->parent_id = $otherLabel->id;
        $this->labelParent->save();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('Unresolved parent conflict', $e->getMessage());
        }
    }

    public function testPerformParentConflictTakeImport()
    {
        $import = $this->getDefaultImport();
        $otherLabel = LabelTest::create(['label_tree_id' => $this->labelTree->id]);
        $this->labelChild->parent_id = $otherLabel->id;
        $this->labelChild->save();
        $import->perform(null, null, [], [$this->labelChild->id => 'import']);
        $this->assertEquals($this->labelParent->id, $this->labelChild->fresh()->parent_id);
    }

    public function testPerformParentConflictTakeImportNull()
    {
        $this->labelChild->parent_id = null;
        $this->labelChild->save();
        $import = $this->getDefaultImport();
        $this->labelChild->parent_id = $this->labelParent->id;
        $this->labelChild->save();
        $import->perform(null, null, [], [$this->labelChild->id => 'import']);
        $this->assertNull($this->labelChild->fresh()->parent_id);
    }

    public function testPerformParentConflictTakeExisting()
    {
        $import = $this->getDefaultImport();
        $otherLabel = LabelTest::create(['label_tree_id' => $this->labelTree->id]);
        $this->labelChild->parent_id = $otherLabel->id;
        $this->labelChild->save();
        $import->perform(null, null, [], [$this->labelChild->id => 'existing']);
        $this->assertEquals($otherLabel->id, $this->labelChild->fresh()->parent_id);
    }

    public function testPerformUserConflicts()
    {
        $import = $this->getDefaultImport();
        $this->labelTree->delete();
        $this->user->uuid = Uuid::uuid4();
        $this->user->save();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertFalse(LabelTree::where('uuid', $this->labelTree->uuid)->exists());
        }
    }

    public function testPerformExceptionLabels()
    {
        $import = $this->getDefaultImport();
        $import->throw = true;
        $this->labelChild->delete();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertFalse(Label::where('uuid', $this->labelChild->uuid)->exists());
        }
    }

    public function testPerformExceptionLabelTrees()
    {
        $import = $this->getDefaultImport();
        $import->throw = true;
        $this->labelTree->delete();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertFalse(LabelTree::where('uuid', $this->labelTree->uuid)->exists());
        }
    }

    public function testPerformExceptionUsers()
    {
        $import = $this->getDefaultImport();
        $import->throw = true;
        $this->labelTree->members()->delete();
        $this->labelTree->delete();

        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertFalse(User::where('uuid', $this->user->uuid)->exists());
        }
    }

    protected function getDefaultImport()
    {
        return $this->getImport([$this->labelTree->id]);
    }

    protected function getImport(array $ids, $class = LabelTreeImportStub::class)
    {
        $export = new LabelTreeExport($ids);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'label_tree_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();

        return new $class($this->destination);
    }
}

class LabelTreeImportStub extends LabelTreeImport
{
    public $throw;
    protected function mergeLabels($mergeLabels, $nameConflictResolution, $parentConflictResolution, $labelIdMap)
    {
        if ($this->throw) {
            throw new Exception('Throwing up');
        }

        return parent::mergeLabels($mergeLabels, $nameConflictResolution, $parentConflictResolution, $labelIdMap);
    }
}

class LabelTreeImportWithoutVersionStub extends LabelTreeImport
{
    public function getImportLabelTrees()
    {
        $this->importLabelTrees = parent::getImportLabelTrees()->map(function ($tree) {
            unset($tree['version']);

            return $tree;
        });

        return $this->importLabelTrees;
    }
}
