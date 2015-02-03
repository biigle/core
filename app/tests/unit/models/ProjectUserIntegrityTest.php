<?php

class ProjectUserIntegrityTest extends TestCase {

	public function testRoleOnDeleteRestrict()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$role->delete();
	}

	public function testProjectOnDeleteCascade()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$this->assertEquals(1, $user->projects()->count());
		$project->delete();
		$this->assertEquals(0, $user->projects()->count());
	}

	public function testUserOnDeleteCascade()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$this->assertEquals(1, $project->users()->count());
		$user->delete();
		$this->assertEquals(0, $project->users()->count());
	}

	public function testUserProjectRoleUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));
		$project->users()->attach($user->id, array('role_id' => $role->id));
	}
}