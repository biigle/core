<?php

use Dias\Project;
use Dias\Role;

class ProjectUserApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->doTestApiRoute('GET', '/api/v1/projects/1/users');
		
		// api key authentication
		$this->callToken('GET', '/api/v1/projects/1/users', $this->admin);
		$this->assertResponseOk();

		// the user doesn't belong to this project
		$this->callToken('GET', '/api/v1/projects/2/users', $this->admin);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->admin);
		$r = $this->callAjax('GET', '/api/v1/projects/1/users');
		$this->assertResponseOk();

		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
		$this->assertContains('"firstname":"joe"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testUpdate()
	{
		$this->doTestApiRoute('PUT', '/api/v1/projects/1/users/1');

		// non-admins are not allowed to modify users
		$this->callToken('PUT', '/api/v1/projects/1/users/1', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/projects/1/users/5', $this->editor);
		$this->assertResponseStatus(401);

		// api key authentication
		// user doesn't exist
		$this->callToken('PUT', '/api/v1/projects/1/users/5', $this->admin);
		$this->assertResponseStatus(400);

		// session cookie authentication
		$this->be($this->admin);
		// missing arguments
		$this->callAjax('PUT', '/api/v1/projects/1/users/'.$this->editor->id,
			array('_token' => Session::token())
		);
		$this->assertResponseStatus(400);

		// role does not exist
		$this->callAjax('PUT', '/api/v1/projects/1/users/'.$this->editor->id,
			array('_token' => Session::token(), 'project_role_id' => 100)
		);
		$this->assertResponseStatus(400);

		$this->assertEquals(2, $this->project->users()->find($this->editor->id)->project_role_id);

		$this->callAjax('PUT', '/api/v1/projects/1/users/'.$this->editor->id,
			array('_token' => Session::token(), 'project_role_id' => 3)
		);

		$this->assertResponseOk();
		$this->assertEquals(3, $this->project->users()->find($this->editor->id)->project_role_id);
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/projects/1/users');

		$this->callToken('POST', '/api/v1/projects/1/users', $this->user);
		$this->assertResponseStatus(401);

		// api key authentication
		// user doesn't exist
		$this->callToken('POST', '/api/v1/projects/1/users', $this->admin);
		$this->assertResponseStatus(400);

		// non-admins are not allowed to add users
		$this->callToken('POST', '/api/v1/projects/1/users', $this->editor);
		$this->assertResponseStatus(401);

		$this->project->users()->detach($this->editor->id);
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		// session cookie authentication
		$this->be($this->admin);
		// missing arguments
		$this->callAjax('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token(),
			'id' => $this->editor->id
		));
		$this->assertResponseStatus(400);

		$this->callAjax('POST', '/api/v1/projects/1/users', array(
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
		$this->doTestApiRoute('DELETE', '/api/v1/projects/1/users/1');

		// non-admins are not allowed to delete other users
		$this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->admin->id, $this->editor);
		$this->assertResponseStatus(401);

		// but they can delete themselves
		$this->assertNotNull($this->project->fresh()->users()->find($this->editor->id));

		$this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->editor->id, $this->editor);

		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		$this->project->addUserId($this->editor->id, Role::editorId());

		// admins can delete anyone
		$this->assertNotNull($this->project->fresh()->users()->find($this->editor->id));

		$this->callToken('DELETE', '/api/v1/projects/1/users/'.$this->editor->id,$this->admin);

		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($this->editor->id));

		$this->project->addUserId($this->editor->id, Role::editorId());
		
		// session cookie authentication
		$this->be($this->admin);

		// but admins cannot delete themselves if they are the only admin left
		$this->callAjax('DELETE', '/api/v1/projects/1/users/'.$this->admin->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);
	}
}