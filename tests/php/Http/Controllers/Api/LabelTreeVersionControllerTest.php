<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\LabelTree;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\LabelTreeVersionTest;

class LabelTreeVersionControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $master = $this->labelTree();
        $this->labelChild(); // Create label parent and label child.
        $master->addMember($this->editor(), Role::editorId());
        $master->addMember($this->admin(), Role::adminId());
        $master->authorizedProjects()->attach($this->project()->id);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$master->id}/versions");

        $this->beUser();
        $this->postJson("/api/v1/label-trees/{$master->id}/versions")
            ->assertStatus(403);

        $this->beEditor();
        $this->postJson("/api/v1/label-trees/{$master->id}/versions")
            ->assertStatus(403);

        $this->beAdmin();
        // Requires a name.
        $this->postJson("/api/v1/label-trees/{$master->id}/versions")
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'description' => 'First version.',
            ])
            ->assertStatus(200);

        $this
            ->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'description' => 'Another first version.',
            ])
            ->assertStatus(422);

        $version = $master->versions()->first();
        $this->assertNotNull($version);
        $this->assertSame('v1.0', $version->name);
        $this->assertSame($master->id, $version->label_tree_id);

        $versionTree = LabelTree::where('version_id', $version->id)->first();
        $this->assertNotNull($versionTree);
        $this->assertSame($master->name, $versionTree->name);
        $this->assertSame('First version.', $versionTree->description);
        $this->assertSame($master->visibility_id, $versionTree->visibility_id);
        $this->assertNotEquals($master->uuid, $versionTree->uuid);

        $this->assertNotNull($versionTree->authorizedProjects()->find($this->project()->id));

        $labels = $master->labels()->get();
        $versionLabels = $versionTree->labels()->orderBy('parent_id')->get();
        $this->assertEquals($labels->pluck('name'), $versionLabels->pluck('name'));
        $this->assertEquals($labels->pluck('color'), $versionLabels->pluck('color'));
        $this->assertNotEquals($labels->pluck('uuid'), $versionLabels->pluck('uuid'));
        $this->assertSame($versionLabels[0]->parent_id, $versionLabels[1]->id);
        $this->assertNull($versionLabels[1]->parent_id);
    }

    public function testStoreDoi()
    {
        $master = $this->labelTree();
        $master->addMember($this->admin(), Role::adminId());
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'doi' => 'https://doi.org/10.5281/zenodo.xxxxxxx',
            ])
            ->assertStatus(200);
        $version = $master->versions()->first();
        $this->assertSame('10.5281/zenodo.xxxxxxx', $version->doi);
    }

    public function testStoreDoiEmpty()
    {
        $master = $this->labelTree();
        $master->addMember($this->admin(), Role::adminId());
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'doi' => '',
            ])
            ->assertStatus(200);
        $version = $master->versions()->first();
        $this->assertNull($version->doi);
    }

    public function testUpdate()
    {
        $tree = $this->labelTree();
        $tree->addMember($this->editor(), Role::editorId());
        $tree->addMember($this->admin(), Role::adminId());
        $version = LabelTreeVersionTest::create(['label_tree_id' => $tree->id]);

        $this->doTestApiRoute('PUT', "/api/v1/label-tree-versions/{$version->id}");

        $this->beEditor();
        $this->putJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(403);

        $this->beAdmin();
        $this->putJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(422);

        $this
            ->putJson("/api/v1/label-tree-versions/{$version->id}", [
                'doi' => 'https://doi.org/10.5281/zenodo.xxxxxxx',
            ])
            ->assertStatus(200);

        $this->assertSame('10.5281/zenodo.xxxxxxx', $version->fresh()->doi);
    }

    public function testDestroy()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editorId());
        $version->labelTree->addMember($this->admin(), Role::adminId());
        $this->labelTree()->version_id = $version->id;
        $this->labelTree()->save();

        $a = ImageAnnotationLabelTest::create(['label_id' => $this->labelRoot()->id]);

        $this->doTestApiRoute('DELETE', "/api/v1/label-tree-versions/{$version->id}");

        $this->beEditor();
        $this->deleteJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(403);

        $this->beAdmin();
        $this->deleteJson("/api/v1/label-tree-versions/999")
            ->assertStatus(404);

        $this->deleteJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(403);

        $a->delete();

        $this->deleteJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(200);

        $this->assertNull($version->fresh());
        $this->assertNull($this->labelTree()->fresh());
        $this->assertNotNull($version->labelTree->fresh());
    }
}
