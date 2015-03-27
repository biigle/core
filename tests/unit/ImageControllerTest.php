<?php

use Dias\Role;

class ImageControllerTest extends TestCase {

	public function testIndex() {
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$image = ImageTest::create();
		$image->save();
		$project->addTransectId($image->transect->id);

		// not logged in
		$this->call('GET', 'images/'.$image->id);
		$this->assertResponseStatus(302);

		// doesn't belong to project
		$this->be($user);
		$this->call('GET', 'images/'.$image->id);
		$this->assertResponseStatus(401);

		$this->be($project->creator);
		$this->call('GET', 'images/'.$image->id);
		$this->assertResponseOk();

		// doesn't exist
		$this->call('GET', 'images/-1');
		$this->assertResponseStatus(404);
	}
}