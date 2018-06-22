<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;
use Biigle\Project;

class ProjectUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/users");

        // the user doesn't belong to this project
        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/users");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("/api/v1/projects/{$id}/users");
        $content = $response->getContent();
        $response->assertStatus(200);

        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
        $this->assertContains('"firstname":"'.$this->admin()->firstname.'"', $content);
        $this->assertContains('"lastname":"'.$this->admin()->lastname.'"', $content);
        $this->assertNotContains('"email":"'.$this->admin()->email.'"', $content);
        $this->assertContains('project_role_id', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testUpdate()
    {
        // create admin
        $this->admin();
        // the creator is also admin and shouldn't interfere with these tests
        $this->project()->creator->delete();

        $id = $this->project()->id;
        $this->doTestApiRoute('PUT', "/api/v1/projects/{$id}/users/1");

        // non-admins are not allowed to modify users
        $this->beUser();
        $response = $this->put("/api/v1/projects/{$id}/users/1");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put("/api/v1/projects/{$id}/users/5");
        $response->assertStatus(403);

        // user doesn't exist
        $this->beAdmin();
        $response = $this->put("/api/v1/projects/{$id}/users/5");
        $response->assertStatus(400);

        // missing arguments
        $response = $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(400);

        // role does not exist
        $response = $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => 100,
        ]);
        $response->assertStatus(400);

        // last admin cannot be removed
        $this->json('PUT', "/api/v1/projects/{$id}/users/".$this->admin()->id, [
                'project_role_id' => Role::$guest->id,
            ])
            ->assertStatus(400)
            ->assertJsonFragment(['message' => 'The last admin of '.$this->project()->name.' cannot be removed. The admin status must be passed on to another user first.']);

        $this->assertEquals(2, $this->project()->users()->find($this->editor()->id)->project_role_id);

        $response = $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => Role::$guest->id,
        ]);

        $response->assertStatus(200);
        $this->assertEquals(3, $this->project()->users()->find($this->editor()->id)->project_role_id);
    }

    public function testAttach()
    {
        $pid = $this->project()->id;
        $id = $this->user()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/users/{$id}");

        $this->beUser();
        $response = $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(403);

        // missing arguments
        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(400);

        // non-admins are not allowed to add users
        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(403);

        $this->assertNull($this->project()->fresh()->users()->find($id));

        $this->beAdmin();
        // missing arguments
        $response = $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $response->assertStatus(400);

        $response = $this->post("/api/v1/projects/{$pid}/users/{$id}", [
            'project_role_id' => 2,
        ]);

        $response->assertStatus(200);
        $newUser = $this->project()->users()->find($id);
        $this->assertEquals($id, $newUser->id);
        $this->assertEquals(Role::$editor->id, $newUser->project_role_id);
    }

    public function testDestroy()
    {
        // create admin
        $this->admin();
        // creator is an admin and shouldn't play a role in this test
        $this->project()->creator->delete();
        $id = $this->project()->id;

        // token mismatch
        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$id}/users/1");

        // non-admins are not allowed to delete other users
        $this->beEditor();
        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->admin()->id);
        $response->assertStatus(403);

        // but they can delete themselves
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(200);
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

        // admins can delete anyone
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $response->assertStatus(200);
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

        // but admins cannot delete themselves if they are the only admin left
        $response = $this->delete("/api/v1/projects/{$id}/users/".$this->admin()->id);
        $response->assertStatus(400);
    }
}
