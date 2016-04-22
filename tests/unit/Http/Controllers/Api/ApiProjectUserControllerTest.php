<?php

use Dias\Project;
use Dias\Role;

class ApiProjectUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/projects/1/users');

        // api key authentication
        $this->callToken('GET', '/api/v1/projects/1/users', $this->admin());
        $this->assertResponseOk();

        // the user doesn't belong to this project
        $this->callToken('GET', '/api/v1/projects/1/users', $this->user());
        $this->assertResponseStatus(401);

        // session cookie authentication
        $this->be($this->admin());
        $r = $this->call('GET', '/api/v1/projects/1/users');
        $this->assertResponseOk();

        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
        $this->assertContains('"name":"'.$this->admin()->name.'"', $r->getContent());
        $this->assertContains('project_role_id', $r->getContent());
        $this->assertNotContains('pivot', $r->getContent());
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
        $this->callToken('PUT', "/api/v1/projects/{$id}/users/1", $this->user());
        $this->assertResponseStatus(401);

        $this->callToken('PUT', "/api/v1/projects/{$id}/users/5", $this->editor());
        $this->assertResponseStatus(401);

        // api key authentication
        // user doesn't exist
        $this->callToken('PUT', "/api/v1/projects/{$id}/users/5", $this->admin());
        $this->assertResponseStatus(400);

        // session cookie authentication
        $this->be($this->admin());
        // missing arguments
        $this->call('PUT', "/api/v1/projects/{$id}/users/".$this->editor()->id,
            [
                '_token' => Session::token(),
            ]
        );
        $this->assertResponseStatus(400);

        // role does not exist
        $this->call('PUT', "/api/v1/projects/{$id}/users/".$this->editor()->id,
            [
                '_token' => Session::token(),
                'project_role_id' => 100,
            ]
        );
        $this->assertResponseStatus(400);

        // last admin cannot be removed (ajax request gets json response)
        $r = $this->callAjax('PUT', "/api/v1/projects/{$id}/users/".$this->admin()->id,
            [
                '_token' => Session::token(),
                'project_role_id' => Role::$guest->id,
            ]
        );
        $this->assertResponseStatus(400);
        $this->assertStringStartsWith('{"message":"The last admin of '.$this->project()->name.' cannot be removed.', $r->getContent());

        $this->assertEquals(2, $this->project()->users()->find($this->editor()->id)->project_role_id);

        $this->call('PUT', "/api/v1/projects/{$id}/users/".$this->editor()->id,
            [
                '_token' => Session::token(),
                'project_role_id' => Role::$guest->id,
            ]
        );

        $this->assertResponseOk();
        $this->assertEquals(3, $this->project()->users()->find($this->editor()->id)->project_role_id);
    }

    public function testAttach()
    {
        $pid = $this->project()->id;
        $id = $this->user()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/users/{$id}");

        $this->callToken('POST', "/api/v1/projects/{$pid}/users/{$id}", $this->user());
        $this->assertResponseStatus(401);

        // api key authentication
        // missing arguments
        $this->callToken('POST', "/api/v1/projects/{$pid}/users/{$id}", $this->admin());
        $this->assertResponseStatus(400);

        // non-admins are not allowed to add users
        $this->callToken('POST', "/api/v1/projects/{$pid}/users/{$id}", $this->editor());
        $this->assertResponseStatus(401);

        $this->assertNull($this->project()->fresh()->users()->find($id));

        // session cookie authentication
        $this->be($this->admin());
        // missing arguments
        $this->call('POST', "/api/v1/projects/{$pid}/users/{$id}", [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(400);

        $this->call('POST', "/api/v1/projects/{$pid}/users/{$id}", [
            '_token' => Session::token(),
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
        $this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->admin()->id, $this->editor());
        $this->assertResponseStatus(401);

        // but they can delete themselves
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->editor()->id, $this->editor());

        $this->assertResponseOk();
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

        // admins can delete anyone
        $this->assertNotNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->editor()->id, $this->admin());

        $this->assertResponseOk();
        $this->assertNull($this->project()->fresh()->users()->find($this->editor()->id));

        $this->project()->addUserId($this->editor()->id, Role::$editor->id);

// session cookie authentication
        $this->be($this->admin());

        // but admins cannot delete themselves if they are the only admin left
        $this->call('DELETE', '/api/v1/projects/1/users/'.$this->admin()->id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(400);
    }
}
