<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Visibility;

class LabelTreeAuthorizedProjectControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $tree->addMember($this->admin(), Role::admin());

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $response->assertStatus(403);

        $this->beAdmin();

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        // project id is required
        $response->assertStatus(422);

        $this->assertFalse($tree->authorizedProjects()->exists());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $response->assertStatus(200);
        $this->assertTrue($tree->authorizedProjects()->exists());

        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        // should not fail if same project is authorized twice but should not add it twice
        $response->assertStatus(200);
        $this->assertEquals(1, $tree->authorizedProjects()->count());
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->admin(), Role::admin());
        $this->beAdmin();
        $this->get('/');
        $response = $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testStoreVersions()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/authorized-projects", [
                'id' => $this->project()->id,
            ])
            ->assertStatus(403);
    }

    public function testStorePropagateVersions()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$version->labelTree->id}/authorized-projects", [
                'id' => $this->project()->id,
            ])
            ->assertStatus(200);
        $this->assertNotNull($tree->authorizedProjects()->find($this->project()->id));
    }

    public function testDestroy()
    {
        $project = $this->project();
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $tree->addMember($this->editor(), Role::editor());
        $tree->addMember($this->admin(), Role::admin());
        $tree->authorizedProjects()->attach($project->id);
        $tree->projects()->attach($project->id);

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");

        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not a member
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not admin
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $response->assertStatus(200);
        $this->assertEquals(0, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());

        $tree->authorizedProjects()->attach($project->id);
        $tree->visibility_id = Visibility::privateId();
        $tree->save();

        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // if the tree is private and project authorization is removed, the
        // tree should be removed from the project as well
        $response->assertStatus(200);
        $this->assertEquals(0, $tree->authorizedProjects()->count());
        $this->assertEquals(0, $tree->projects()->count());
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $tree->addMember($this->admin(), Role::admin());
        $project = $this->project();
        $tree->authorizedProjects()->attach($project->id);

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $this->assertFalse($tree->authorizedProjects()->exists());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $tree->authorizedProjects()->attach($project->id);

        $response = $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertFalse($tree->authorizedProjects()->exists());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }

    public function testDestroyVersions()
    {
        $id = $this->project()->id;
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $tree->authorizedProjects()->attach($id);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$tree->id}/authorized-projects/{$id}")
            ->assertStatus(403);
    }

    public function testDestroyPropagateVersions()
    {
        $id = $this->project()->id;
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::admin());
        $version->labelTree->authorizedProjects()->attach($id);
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $tree->authorizedProjects()->attach($id);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$version->labelTree->id}/authorized-projects/{$id}")
            ->assertStatus(200);
        $this->assertNull($tree->authorizedProjects()->find($id));
    }
}
