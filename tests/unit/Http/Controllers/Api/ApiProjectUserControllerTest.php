<?php

use Dias\Project;
use Dias\Role;

class ApiProjectUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/users");

        // the user doesn't belong to this project
        $this->beUser();
        $this->get("/api/v1/projects/{$id}/users");
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->get("/api/v1/projects/{$id}/users");
        $content = $this->response->getContent();
        $this->assertResponseOk();

        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
        $this->assertContains('"name":"'.$this->admin()->name.'"', $content);
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
        $this->put("/api/v1/projects/{$id}/users/1");
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->put("/api/v1/projects/{$id}/users/5");
        $this->assertResponseStatus(401);

        // user doesn't exist
        $this->beAdmin();
        $this->put("/api/v1/projects/{$id}/users/5");
        $this->assertResponseStatus(400);

        // missing arguments
        $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id);
        $this->assertResponseStatus(400);

        // role does not exist
        $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => 100,
        ]);
        $this->assertResponseStatus(400);

        // last admin cannot be removed
        $this->json('PUT', "/api/v1/projects/{$id}/users/".$this->admin()->id, [
            'project_role_id' => Role::$guest->id,
        ]);
        $this->assertResponseStatus(400);
        $this->assertStringStartsWith('{"message":"The last admin of '.$this->project()->name.' cannot be removed.', $this->response->getContent());

        $this->assertEquals(2, $this->project()->users()->find($this->editor()->id)->project_role_id);

        $this->put("/api/v1/projects/{$id}/users/".$this->editor()->id, [
            'project_role_id' => Role::$guest->id,
        ]);

        $this->assertResponseOk();
        $this->assertEquals(3, $this->project()->users()->find($this->editor()->id)->project_role_id);
    }

    public function testAttach()
    {
        $pid = $this->project()->id;
        $id = $this->user()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/users/{$id}");

        $this->beUser();
        $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $this->assertResponseStatus(401);

        // missing arguments
        $this->beAdmin();
        $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $this->assertResponseStatus(400);

        // non-admins are not allowed to add users
        $this->beEditor();
        $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $this->assertResponseStatus(401);

        $this->assertNull($this->project()->fresh()->users()->find($id));

        $this->beAdmin();
        // missing arguments
        $this->post("/api/v1/projects/{$pid}/users/{$id}");
        $this->assertResponseStatus(400);

        $this->post("/api/v1/projects/{$pid}/users/{$id}", [
            'project_role_id' => 2,
        ]);

        $this->assertResponseOk();
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

        // token mismatch
        $this->doTestApiRoute('DELETE', '/api/v1/projects/1/users/1');

        // non-admins are not allowed to delete other users
        $this->beEditor();
        $this->delete('/api/v1/projects/1/users/'.$this->admin()->id);
        $this->assertResponseStatus(401);

        // but they can delete themselves
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->delete('/api/v1/projects/1/users/'.$this->editor()->id);
        $this->assertResponseOk();
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

        // admins can delete anyone
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->beAdmin();
        $this->delete('/api/v1/projects/1/users/'.$this->editor()->id);
        $this->assertResponseOk();
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

        // but admins cannot delete themselves if they are the only admin left
        $this->delete('/api/v1/projects/1/users/'.$this->admin()->id);
        $this->assertResponseStatus(400);
    }
}
