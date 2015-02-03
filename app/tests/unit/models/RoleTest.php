<?php

class RoleTest extends TestCase {

	public static function create($name = 'member')
	{
		$role = new Role;
		$role->name = $name;
		return $role;
	}

	public function testCreation()
	{
		$role = RoleTest::create();
		$this->assertTrue($role->save());
	}

	public function testAttributes()
	{
		$role = RoleTest::create();
		$role->save();
		$this->assertNotNull($role->name);
	}

	public function testNameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$role = RoleTest::create();
		$role->name = null;
		$role->save();
	}

	public function testNameUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$role = RoleTest::create();
		$role->save();

		$role = RoleTest::create();
		$role->save();
	}

	public function testOnDeleteRestrict()
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
}