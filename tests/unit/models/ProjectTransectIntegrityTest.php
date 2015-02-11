<?php

class ProjectTransectIntegrityTest extends TestCase {

	public function testProjectOnDeleteRestrict()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();

		$project->transects()->attach($transect->id);
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project->delete();
	}

	public function testTransectOnDeleteCascade()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();
		$project->transects()->attach($transect->id);

		$transect->delete();
		$this->assertEquals(0, $project->transects()->count());
	}

	public function testProjectTransectUnique()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();

		$project->transects()->attach($transect->id);
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project->transects()->attach($transect->id);
	}
}