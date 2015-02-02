<?php

class RoleTest extends TestCase {

	public static function createRole($name = 'member')
	{
		$role = new Role;
		$role->name = $name;
		return $role;
	}

	public function testRoleCreation()
	{
		$role = RoleTest::createRole();
		$this->assertTrue($role->save());
	}

	public function testNameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$role = RoleTest::createRole();
		$role->name = null;
		$role->save();
	}

	public function testNameUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$role = RoleTest::createRole();
		$role->save();

		$role = RoleTest::createRole();
		$role->save();
	}
}