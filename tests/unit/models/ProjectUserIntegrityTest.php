<?php

class ProjectUserIntegrityTest extends TestCase {

	public function testRoleOnDeleteRestrict()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->addUserId($user->id, $role->id);
		$this->setExpectedException('Illuminate\Database\QueryException');
		$role->delete();
	}

	public function testProjectOnDeleteCascade()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->addUserId($user->id, $role->id);

		$this->assertEquals(1, $user->projects()->count());
		$project->delete();
		$this->assertEquals(0, $user->projects()->count());
	}

	public function testUserOnDeleteCascade()
	{	
		$creator = UserTest::create();
		$creator->save();
		$project = ProjectTest::create('test', 'test', $creator);
		$project->save();

		$this->assertEquals(1, $project->users()->count());
		$creator->delete();
		$this->assertEquals(0, $project->users()->count());
	}

	public function testUserProjectRoleUnique()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->addUserId($user->id, $role->id);
		$this->setExpectedException('Illuminate\Database\QueryException');
		// attach manually so the error-check in addUserId is circumvented
		$project->users()->attach($user->id, array('project_role_id' => $role->id));
	}
}