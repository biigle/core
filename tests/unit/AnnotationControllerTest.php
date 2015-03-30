<?php

use Dias\Role;

class AnnotationControllerTest extends TestCase {

	public function testIndex() {
		// $project = ProjectTest::create();
		// $project->save();
		// $transect = TransectTest::create();
		// $transect->save();
		// $project->addTransectId($transect->id);
		// $user = UserTest::create();
		// $user->save();

		// // not logged in
		// $this->call('GET', 'transects/'.$transect->id);
		// $this->assertResponseStatus(302);

		// // doesn't belong to project
		// $this->be($user);
		// $this->call('GET', 'transects/'.$transect->id);
		// $this->assertResponseStatus(401);

		// $this->be($project->creator);
		// $this->call('GET', 'transects/'.$transect->id);
		// $this->assertResponseOk();

		// // doesn't exist
		// $this->call('GET', 'projects/-1');
		// $this->assertResponseStatus(404);
	}
}