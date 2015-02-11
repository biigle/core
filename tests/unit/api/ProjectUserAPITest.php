<?php

use Dias\Project;

class ProjectUserAPITest extends APITestCase {

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
		$this->call('GET', '/api/v1/projects/1/users');
		$this->assertResponseStatus(401);
		
		// api key authentication
		$this->call('GET', '/api/v1/projects/1/users', [], [], [], $this->credentials);
		$this->assertResponseOk();

		// the user doesn't belong to this project
		$this->call('GET', '/api/v1/projects/2/users', [], [], [], $this->credentials);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->user);
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
		$user = UserTest::create();
		$user->save();
		$this->project->users()->attach($user->id, array('role_id' => 2));
		$this->be($user);
		$this->call('PUT', '/api/v1/projects/1/users/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		Auth::logout();

		// api key authentication
		// user doesn't exist
		$this->call('PUT', '/api/v1/projects/1/users/5', array(
			'_token' => Session::token()
		), [], [], $this->credentials);
		$this->assertResponseStatus(400);

		// session cookie authentication
		$this->be($this->user);
		// missing arguments
		$this->call('PUT', '/api/v1/projects/1/users/'.$user->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);

		// role does not exist
		$this->call('PUT', '/api/v1/projects/1/users/'.$user->id, array(
			'_token' => Session::token(),
			'role_id' => 100
		));
		$this->assertResponseStatus(400);

		$this->assertEquals(2, $this->project->users()->find($user->id)->role_id);
		$this->call('PUT', '/api/v1/projects/1/users/'.$user->id, array(
			'_token' => Session::token(),
			'role_id' => 3
		));
		$this->assertResponseOk();
		$this->assertEquals(3, $this->project->users()->find($user->id)->role_id);
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
		), [], [], $this->credentials);
		$this->assertResponseStatus(400);

		// non-admins are not allowed to add users
		$user = UserTest::create();
		$user->save();
		$this->project->users()->attach($user->id, array('role_id' => 2));
		$this->be($user);
		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		Auth::logout();

		$this->project->users()->detach($user->id);
		$this->assertNull($this->project->fresh()->users()->find($user->id));

		// session cookie authentication
		$this->be($this->user);
		// missing arguments
		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token(),
			'id' => $user->id
		));
		$this->assertResponseStatus(400);

		$this->call('POST', '/api/v1/projects/1/users', array(
			'_token' => Session::token(),
			'id' => $user->id,
			'role_id' => 2
		));
		$this->assertResponseOk();
		$newUser = $this->project->fresh()->users()->find($user->id);
		$this->assertEquals($user->id, $newUser->id);
		$this->assertEquals(2, $newUser->role_id);
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
		$user = UserTest::create();
		$user->save();
		$this->project->users()->attach($user->id, array('role_id' => 2));
		$this->be($user);
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->user->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// but they can delete themselves
		$this->assertNotNull($this->project->fresh()->users()->find($user->id));
		$this->call('DELETE', '/api/v1/projects/1/users/'.$user->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($user->id));

		Auth::logout();
		$this->project->users()->attach($user->id, array('role_id' => 2));

		// api key authentication
		// admins can delete anyone
		$this->assertNotNull($this->project->fresh()->users()->find($user->id));
		$this->call('DELETE', '/api/v1/projects/1/users/'.$user->id, array(
			'_token' => Session::token(),
		), [], [], $this->credentials);
		$this->assertResponseOk();
		$this->assertNull($this->project->fresh()->users()->find($user->id));

		$this->project->users()->attach($user->id, array('role_id' => 2));
		// session cookie authentication
		$this->be($this->user);

		// but admins cannot delete themselves if they are the only admin left
		$this->call('DELETE', '/api/v1/projects/1/users/'.$this->user->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(400);
	}
}