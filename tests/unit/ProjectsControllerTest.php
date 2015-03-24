<?php

use Dias\Role;

class ProjectsControllerTest extends TestCase {

	public function testEdit() {
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();

		// not logged in
		$this->call('GET', 'projects/1');
		$this->assertResponseStatus(302);

		// doesn't belong to project
		$this->be($user);
		$this->call('GET', 'projects/1');
		$this->assertResponseStatus(401);

		// can't admin the project
		$project->addUserId($user->id, Role::editorId());
		$this->call('GET', 'projects/1');
		$this->assertResponseOk();

		// diesn't exist
		$this->call('GET', 'projects/-1');
		$this->assertResponseStatus(404);
	}

	public function testCreate() {
		$user = UserTest::create();
		$user->save();

		// not logged in
		$this->call('GET', 'projects/create');
		$this->assertResponseStatus(302);

		$this->be($user);
		$r = $this->call('GET', 'projects/create');
		$this->assertResponseOk();
	}
}