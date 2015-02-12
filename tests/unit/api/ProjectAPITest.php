<?php

use Dias\Project;

class ProjectAPITest extends APITestCase {

	private $project;

	public function setUp()
	{
		parent::setUp();
		Session::start();

		$this->project = ProjectTest::create();
		$this->project->save();
		$this->project->users()->attach($this->user->id, array('role_id' => 1));
	}

	public function testIndex()
	{
		$this->call('GET', '/api/v1/projects');
		$this->assertResponseStatus(405);

		// call without authentication fails
		$this->call('GET', '/api/v1/projects/my');
		$this->assertResponseStatus(401);
		
		// api key authentication
		$this->call('GET', '/api/v1/projects/my', [], [], [], $this->credentials);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->call('GET', '/api/v1/projects/my');
		$this->assertResponseOk();

		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
		$this->assertContains('"description":"test"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/projects/1');
		$this->assertResponseStatus(401);
		
		// api key authentication
		$this->call('GET', '/api/v1/projects/1', [], [], [], $this->credentials);
		$this->assertResponseOk();

		$this->call('GET', '/api/v1/projects/2', [], [], [], $this->credentials);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->user);
		$this->call('GET', '/api/v1/projects/2');
		$this->assertResponseStatus(401);

		$r = $this->call('GET', '/api/v1/projects/1');
		$this->assertResponseOk();

		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"description":"test"', $r->getContent());
		$this->assertNotContains('pivot', $r->getContent());
	}

	public function testUpdate()
	{
		// token mismatch
		$this->call('PUT', '/api/v1/projects/1');
		$this->assertResponseStatus(403);

		$this->call('PUT', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		$this->call('PUT', '/api/v1/projects/1', array(
			'_token' => Session::token()
		), [], [], $this->credentials);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$this->call('PUT', '/api/v1/projects/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

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

		// non-admins are not allowed to update
		$user = UserTest::create();
		$user->save();
		$this->project->users()->attach($user->id, array('role_id' => 2));
		$this->be($user);
		$this->call('PUT', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
	}

	public function testStore()
	{
		$this->call('POST', '/api/v1/projects');
		$this->assertResponseStatus(403);

		$this->call('POST', '/api/v1/projects', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		// creating an empty project is an error
		$this->call('POST', '/api/v1/projects', array(
			'_token' => Session::token()
		), [], [], $this->credentials);
		$this->assertResponseStatus(400);

		$this->assertNull(Project::find(2));
		$r = $this->call('POST', '/api/v1/projects', array(
			'_token' => Session::token(),
			'name' => 'test project',
			'description' => 'my test project'
		), [], [], $this->credentials);
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"test project"', $r->getContent());
		$this->assertContains('"creator_id":"1"', $r->getContent());
		$this->assertNotNull(Project::find(2));

		// session cookie authentication
		$this->be($this->user);
		$this->call('POST', '/api/v1/projects', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);

		$this->assertNull(Project::find(3));
		$r = $this->call('POST', '/api/v1/projects', array(
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
		$this->call('DELETE', '/api/v1/projects/1');
		$this->assertResponseStatus(403);

		$this->call('DELETE', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// non-admins are not allowed to delete the project
		$user = UserTest::create();
		$user->save();
		$this->project->users()->attach($user->id, array('role_id' => 2));
		$this->be($user);
		$this->call('DELETE', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		Auth::logout();

		$this->assertNotNull($this->project->fresh());
		$this->call('DELETE', '/api/v1/projects/1', array(
			'_token' => Session::token(),
		), [], [], $this->credentials);
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh());

		// already deleted projects can't be re-deleted
		$this->be($this->user);
		$this->call('DELETE', '/api/v1/projects/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(404);
	}
}