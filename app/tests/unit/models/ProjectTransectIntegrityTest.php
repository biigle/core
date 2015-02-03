<?php

class ProjectTransectIntegrityTest extends TestCase {

	public function testProjectOnDeleteRestrict()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('jane', 'user', 'pw', 'u@b.com');
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();

		$project->transects()->attach($transect->id);

		$project->delete();
	}

	public function testTransectOnDeleteCascade()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('jane', 'user', 'pw', 'u@b.com');
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();
		$project->transects()->attach($transect->id);

		$transect->delete();
		$this->assertEquals(0, $project->transects()->count());
	}

	public function testProjectTransectUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('jane', 'user', 'pw', 'u@b.com');
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();

		$project->transects()->attach($transect->id);
		$project->transects()->attach($transect->id);
	}
}