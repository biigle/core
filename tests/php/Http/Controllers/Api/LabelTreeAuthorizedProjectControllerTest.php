<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
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
        $tree->visibility_id = Visibility::$private->id;
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
}
