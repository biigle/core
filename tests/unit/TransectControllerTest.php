<?php

use Dias\Role;

class TransectControllerTest extends TestCase {

	public function testIndex() {
		$project = ProjectTest::create();
		$project->save();
		$transect = TransectTest::create();
		$transect->save();
		$project->addTransectId($transect->id);
		$user = UserTest::create();
		$user->save();

		// not logged in
		$this->call('GET', 'transects/'.$transect->id);
		$this->assertResponseStatus(302);

		// doesn't belong to project
		$this->be($user);
		$this->call('GET', 'transects/'.$transect->id);
		$this->assertResponseStatus(401);

		$this->be($project->creator);
		$this->call('GET', 'transects/'.$transect->id);
		$this->assertResponseOk();

		// doesn't exist
		$this->call('GET', 'projects/-1');
		$this->assertResponseStatus(404);
	}

	public function testCreate() {
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();

		// not logged in
		$this->call('GET', 'transects/create');
		$this->assertResponseStatus(302);

		$this->be($user);
		// user is not allowed to edit the project
		$this->call('GET', 'transects/create?project='.$project->id);
		$this->assertResponseStatus(401);

		$this->be($project->creator);
		// project doesn't exist
		$this->call('GET', 'transects/create?project=-1');
		$this->assertResponseStatus(404);

		$this->call('GET', 'transects/create?project='.$project->id);
		$this->assertResponseOk();
	}
}