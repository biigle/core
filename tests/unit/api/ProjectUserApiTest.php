<?php

use Dias\Project;
use Dias\Role;

class ProjectUserApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/projects/1/users');
		$this->assertResponseStatus(401);
		
		// api key authentication
		$this->call('GET', '/api/v1/projects/1/users', [], [], [], $this->adminCredentials);
		$this->assertResponseOk();

		// the user doesn't belong to this project
		$this->call('GET', '/api/v1/projects/2/users', [], [], [], $this->adminCredentials);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->admin);
		$r = $this->call('GET', '/api/v1/projects/1/users');
		$this->assertResponseOk();

		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
		$this->assertContains('"firstname":"joe"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testUpdate()
	{
		// token mismatch
		$this->call('PUT', '/api/v1/projects/1/users/1');
		$this->assertResponseStatus(403);

		$this->call('PUT', '/api/v1/projects/1/users/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// non-admins are not allowed to modify users
		$this->be($this->editor);
		$this->call('PUT', '/api/v1/projects/1/users/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		Auth::logout();

		// api key authentication
		// user doesn't exist
		$this->call('PUT', '/api/v1/projects/1/users/5', array(
			'_token' => Session::token()
		), [], [], $this->adminCredentials);
		$this->assertResponseStatus(400);

		// session cookie authentication
		$this->be($this->admin);
		// missing arguments
		$this->call('PUT', '/api/v1/projects/1/users/'.$this->editor->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);

		// role does not exist
		$this->call('PUT', '/api/v1/projects/1/users/'.$this->editor->id, array(
			'_token' => Session::token(),
			'project_role_id' => 100
		));
		$this->assertResponseStatus(400);

		$this->assertEquals(2, $this->project->users()->find($this->editor->id)->project_role_id);
		$this->call('PUT', '/api/v1/projects/1/users/'.$this->editor->id, array(
			'_token' => Session::token(),
			'project_role_id' => 3
		));
		$this->assertResponseOk();
		$this->assertEquals(3, $this->project->users()->find($this->editor->id)->project_role_id);
	}

	public function testStore()
	{
		// token mismatch
		$this->call('POST', '/api/v1/projects/1/users');
		$this->assertResponseStatus(403);

		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		// user doesn't exist
		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token()
		), [], [], $this->adminCredentials);
		$this->assertResponseStatus(400);

		// non-admins are not allowed to add users
		$this->be($this->editor);
		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		Auth::logout();

		$this->project->users()->detach($this->editor->id);
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		// session cookie authentication
		$this->be($this->admin);
		// missing arguments
		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token(),
			'id' => $this->editor->id
		));
		$this->assertResponseStatus(400);

		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token(),
			'id' => $this->editor->id,
			'project_role_id' => 2
		));
		$this->assertResponseOk();
		$newUser = $this->project->users()->find($this->editor->id);
		$this->assertEquals($this->editor->id, $newUser->id);
		$this->assertEquals(Role::editorId(), $newUser->project_role_id);
	}

	public function testDestroy()
	{
		// creator is an admin and shouldn't play a role in this test
		$this->project->creator->delete();

		// token mismatch
		$this->call('DELETE', '/api/v1/projects/1/users/1');
		$this->assertResponseStatus(403);

		$this->call('DELETE', '/api/v1/projects/1/users/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// non-admins are not allowed to delete other users
		$this->be($this->editor);
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->admin->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// but they can delete themselves
		$this->assertNotNull($this->project->fresh()->users()->find($this->editor->id));
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->editor->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		Auth::logout();
		$this->project->addUserId($this->editor->id, Role::editorId());

		// api key authentication
		// admins can delete anyone
		$this->assertNotNull($this->project->fresh()->users()->find($this->editor->id));
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->editor->id, array(
			'_token' => Session::token(),
		), [], [], $this->adminCredentials);
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		$this->project->addUserId($this->editor->id, Role::editorId());
		// session cookie authentication
		$this->be($this->admin);

		// but admins cannot delete themselves if they are the only admin left
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->admin->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);
	}
}