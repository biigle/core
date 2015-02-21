<?php

use Dias\Role;

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
		$member = UserTest::create();
		$member->save();
		$project = ProjectTest::create();
		$project->save();
		$project->addUserId($member->id, Role::guestId());

		// count the project creator, too
		$this->assertEquals(2, $project->users()->count());
		$member->delete();
		$this->assertEquals(1, $project->users()->count());
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