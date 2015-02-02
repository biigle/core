<?php

class ProjectTest extends TestCase {

	public static function createProject($name = 'test', $desc = 'test', $user = false)
	{
		$user = $user ? $user : UserTest::createUser();
		$user->save();
		$project = new Project;
		$project->name = $name;
		$project->description = $desc;
		$project->creator()->associate($user);
		return $project;
	}

	public function testProjectCreation()
	{
		$project = ProjectTest::createProject();
		$this->assertTrue($project->save());
	}

	public function testNameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project = ProjectTest::createProject();
		$project->name = null;
		$project->save();
	}

	public function testDescriptionRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project = ProjectTest::createProject();
		$project->description = null;
		$project->save();
	}

	public function testUserNullable()
	{
		$project = ProjectTest::createProject();
		$project->save();
		$project->creator()->dissociate();
		$this->assertEquals(null, $project->user_id);
	}

	public function testUserOnDeleteSetNull()
	{
		$project = ProjectTest::createProject();
		$project->save();
		$project->creator()->delete();
		// refresh project object
		$project = Project::find(1);
		$this->assertEquals(null, $project->creator);
	}

	public function testCreator()
	{
		$project = ProjectTest::createProject();
		$this->assertEquals(User::find(1)->id, $project->creator->id);
	}

	public function testAssociateUsers()
	{
		$project = ProjectTest::createProject();
		$project->save();
		$u1 = UserTest::createUser('a', 'b', 'c', 'a@b.c');
		$u1->save();
		$role = RoleTest::createRole();
		$role->save();
		$project->users()->attach($u1->id, array('role_id' => $role->id));

		$user = $project->users()->first();
		$this->assertEquals($u1->id, $user->id);
	}

	public function testUserRoles()
	{
		$project = ProjectTest::createProject();
		$project->save();
		$admin = UserTest::createUser('a', 'b', 'c', 'a@b.c');
		$admin->save();
		$member = UserTest::createUser('a', 'b', 'c', 'a@d.c');
		$member->save();
		$role = RoleTest::createRole('admin');
		$role->save();
		$project->users()->attach($admin->id, array('role_id' => $role->id));
		$role = RoleTest::createRole('member');
		$role->save();
		$project->users()->attach($member->id, array('role_id' => $role->id));

		$user = $project->usersWithRole('admin')->first();
		$this->assertEquals($admin->id, $user->id);
		$user = $project->usersWithRole('member')->first();
		$this->assertEquals($member->id, $user->id);
	}

}