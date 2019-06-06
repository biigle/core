<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\AnnotationLabelTest;
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

        $this->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'description' => 'First version.',
            ])
            ->assertStatus(200);

        $this->postJson("/api/v1/label-trees/{$master->id}/versions", [
                'name' => 'v1.0',
                'description' => 'Another first version.',
            ])
            ->assertStatus(422);

        $version = $master->versions()->first();
        $this->assertNotNull($version);
        $this->assertEquals('v1.0', $version->name);
        $this->assertEquals($master->id, $version->label_tree_id);

        $versionTree = LabelTree::where('version_id', $version->id)->first();
        $this->assertNotNull($versionTree);
        $this->assertEquals($master->name, $versionTree->name);
        $this->assertEquals('First version.', $versionTree->description);
        $this->assertEquals($master->visibility_id, $versionTree->visibility_id);
        $this->assertNotEquals($master->uuid, $versionTree->uuid);

        $this->assertNotNull($versionTree->authorizedProjects()->find($this->project()->id));

        $labels = $master->labels()->get();
        $versionLabels = $versionTree->labels()->orderBy('parent_id')->get();
        $this->assertEquals($labels->pluck('name'), $versionLabels->pluck('name'));
        $this->assertEquals($labels->pluck('color'), $versionLabels->pluck('color'));
        $this->assertNotEquals($labels->pluck('uuid'), $versionLabels->pluck('uuid'));
        $this->assertEquals($versionLabels[0]->parent_id, $versionLabels[1]->id);
        $this->assertNull($versionLabels[1]->parent_id);
    }

    public function testUpdate()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editorId());
        $version->labelTree->addMember($this->admin(), Role::adminId());

        $version2 = LabelTreeVersionTest::create([
            'label_tree_id' => $version->label_tree_id,
        ]);

        $this->doTestApiRoute('PUT', "/api/v1/label-tree-versions/{$version->id}");

        $this->beEditor();
        $this->putJson("/api/v1/label-tree-versions/{$version->id}")
            ->assertStatus(403);

        $this->beAdmin();
        $this->putJson("/api/v1/label-tree-versions/999")
            ->assertStatus(404);

        $this->putJson("/api/v1/label-tree-versions/{$version->id}",  [
                'name' => '',
            ])
            ->assertStatus(422);

        $this->putJson("/api/v1/label-tree-versions/{$version->id}",  [
                'name' => 'v1.3',
            ])
            ->assertStatus(200);

        $this->putJson("/api/v1/label-tree-versions/{$version->id}",  [
                'name' => $version2->name,
            ])
            ->assertStatus(422);

        $version->refresh();
        $this->assertEquals('v1.3', $version->name);
    }

    public function testDestroy()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editorId());
        $version->labelTree->addMember($this->admin(), Role::adminId());
        $this->labelTree()->version_id = $version->id;
        $this->labelTree()->save();

        $a = AnnotationLabelTest::create(['label_id' => $this->labelRoot()->id]);

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
