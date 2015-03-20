<?php

use Dias\Project;
use Dias\Role;

class ProjectApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/projects');
		$this->assertResponseStatus(405);

		$this->doTestApiRoute('GET', '/api/v1/projects/my');
		
		// api key authentication
		$this->callToken('GET', '/api/v1/projects/my', $this->admin);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->admin);
		$r = $this->call('GET', '/api/v1/projects/my');
		$this->assertResponseOk();

		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
		$this->assertContains('"description":"test"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testShow()
	{
		$this->doTestApiRoute('GET', '/api/v1/projects/1');
		
		// api key authentication
		$this->callToken('GET', '/api/v1/projects/1', $this->admin);
		$this->assertResponseOk();

		$this->callToken('GET', '/api/v1/projects/1', $this->user);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->admin);
		$this->call('GET', '/api/v1/projects/2');
		$this->assertResponseStatus(404);

		$r = $this->call('GET', '/api/v1/projects/1');
		$this->assertResponseOk();

		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"description":"test"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testUpdate()
	{
		$this->doTestApiRoute('PUT', '/api/v1/projects/1');

		// api key authentication
		$this->callToken('PUT', '/api/v1/projects/1', $this->admin);
		$this->assertResponseOk();

		// non-admins are not allowed to update
		$this->callToken('PUT', '/api/v1/projects/1', $this->editor);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->admin);
		$this->call('PUT', '/api/v1/projects/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(404);

		$this->call('PUT', '/api/v1/projects/1', array(
			'_token' => Session::token(),
			'name' => 'my test',
			'description' => 'this is my test',
			'creator_id' => 5
		));
		$this->assertResponseOk();

		$this->project = $this->project->fresh();
		$this->assertEquals('my test', $this->project->name);
		$this->assertEquals('this is my test', $this->project->description);
		$this->assertNotEquals(5, $this->project->creator_id);
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/projects');

		// api key authentication
		// creating an empty project is an error
		$this->callToken('POST', '/api/v1/projects', $this->admin);
		$this->assertResponseStatus(422);

		$this->assertNull(Project::find(2));

		$r = $this->callToken('POST', '/api/v1/projects', $this->admin, array(
			'name' => 'test project',
			'description' => 'my test project'
		));

		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"test project"', $r->getContent());
		$this->assertNotNull(Project::find(2));

		// session cookie authentication
		$this->be($this->admin);
		$this->assertNull(Project::find(3));

		$r = $this->callAjax('POST', '/api/v1/projects', array(
			'_token' => Session::token(),
			'name' => 'other test project',
			'description' => 'my other test project'
		));

		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"other test project"', $r->getContent());
		$this->assertNotNull(Project::find(3));
	}

	public function testDestroy()
	{
		$this->doTestApiRoute('DELETE', '/api/v1/projects/1');

		// non-admins are not allowed to delete the project
		$this->callToken('DELETE', '/api/v1/projects/1', $this->editor);
		$this->assertResponseStatus(401);

		// do manual logout because the previously logged in editor would persist
		Auth::logout();

		// project still has a transect belonging only to this project
		$this->assertNotNull($this->project->fresh());
		$this->callToken('DELETE', '/api/v1/projects/1', $this->admin);
		$this->assertResponseStatus(400);

		$this->assertNotNull($this->project->fresh());
		$this->callToken('DELETE', '/api/v1/projects/1', $this->admin, array(
			'force' => 'true'
		));
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh());

		// already deleted projects can't be re-deleted
		$this->be($this->admin);
		$this->call('DELETE', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(404);
	}
}