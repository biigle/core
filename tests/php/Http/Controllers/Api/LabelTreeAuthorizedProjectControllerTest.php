<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\Tests\LabelTreeTest;

class LabelTreeAuthorizedProjectControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $tree->addMember($this->admin(), Role::$admin);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");

        $this->beUser();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $this->assertResponseStatus(403);

        $this->beAdmin();

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        // project id is required
        $this->assertResponseStatus(422);

        $this->assertFalse($tree->authorizedProjects()->exists());
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $this->assertResponseOk();
        $this->assertTrue($tree->authorizedProjects()->exists());

        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        // should not fail if same project is authorized twice but should not add it twice
        $this->assertResponseOk();
        $this->assertEquals(1, $tree->authorizedProjects()->count());
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->admin(), Role::$admin);
        $this->beAdmin();
        $this->visit('/');
        $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $project = $this->project();
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);
        $tree->addMember($this->editor(), Role::$editor);
        $tree->addMember($this->admin(), Role::$admin);
        $tree->authorizedProjects()->attach($project->id);
        $tree->projects()->attach($project->id);

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");

        $this->beUser();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not a member
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not admin
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $this->assertResponseOk();
        $this->assertEquals(0, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());

        $tree->authorizedProjects()->attach($project->id);
        $tree->visibility_id = Visibility::$private->id;
        $tree->save();

        $this->assertEquals(1, $tree->authorizedProjects()->count());
        $this->assertEquals(1, $tree->projects()->count());
        $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // if the tree is private and project authorization is removed, the
        // tree should be removed from the project as well
        $this->assertResponseOk();
        $this->assertEquals(0, $tree->authorizedProjects()->count());
        $this->assertEquals(0, $tree->projects()->count());
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);
        $tree->addMember($this->admin(), Role::$admin);
        $project = $this->project();
        $tree->authorizedProjects()->attach($project->id);

        $this->beAdmin();
        $this->visit('/');
        $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $this->assertFalse($tree->authorizedProjects()->exists());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('deleted', true);

        $tree->authorizedProjects()->attach($project->id);

        $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertFalse($tree->authorizedProjects()->exists());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('deleted', true);
    }
}
