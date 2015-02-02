<?php

class UserTest extends TestCase {

	public static function createUser($fn = 'joe', $ln = 'user', $pw = 'pw', $mail = 'm@m.mm')
	{
		$user = new User;
		$user->firstname = $fn;
		$user->lastname = $ln;
		$user->password = Hash::make($pw);
		$user->email = $mail;
		return $user;
	}

	public function testUserCreation()
	{
		$user = UserTest::createUser();
		$this->assertTrue($user->save());
	}

	public function testFirstnameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::createUser();
		$user->firstname = null;
		$user->save();
	}

	public function testLastnameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::createUser();
		$user->lastname = null;
		$user->save();
	}

	public function testPasswordRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::createUser();
		$user->password = null;
		$user->save();
	}

	public function testEmailRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::createUser();
		$user->email = null;
		$user->save();
	}

	public function testEmailUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$user = UserTest::createUser();
		$user->save();
		$user = UserTest::createUser('jane', 'users', 'pwd');
		$user->save();
	}

	public function testProjects()
	{
		$project = ProjectTest::createProject();
		$project->save();
		$user = UserTest::createUser('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::createRole();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$this->assertEquals($user->projects()->first()->id, $project->id);
	}

	public function testCreatedProjects()
	{
		$user = UserTest::createUser();
		$user->save();
		$project = ProjectTest::createProject('test', 'test', $user);
		$project->save();
		$project2 = ProjectTest::createProject('test2', 'test2', $user);
		$project2->save();

		$this->assertEquals($project->id, $user->createdProjects()->first()->id);
		$this->assertEquals(2, $user->createdProjects()->count());
	}

	public function testHasRoleInProject()
	{
		$user = UserTest::createUser('a', 'b', 'c', 'd');
		$user->save();
		$project = ProjectTest::createProject();
		$project->save();
		$memberRole = RoleTest::createRole('member');
		$memberRole->save();
		$adminRole = RoleTest::createRole('admin');
		$adminRole->save();
		$project->users()->attach(
			$user->id,
			array('role_id' => $memberRole->id)
		);

		$this->assertTrue($user->hasRoleInProject($memberRole, $project));
		$this->assertFalse($user->hasRoleInProject($adminRole, $project));
	}

	public function testHiddenAttributes()
	{
		$user = UserTest::createUser();
		$jsonUser = json_decode((string) $user);
		$this->assertObjectNotHasAttribute('password', $jsonUser);
		$this->assertObjectNotHasAttribute('email', $jsonUser);
		$this->assertObjectNotHasAttribute('remember_token', $jsonUser);
		$this->assertObjectNotHasAttribute('created_at', $jsonUser);
		$this->assertObjectNotHasAttribute('updated_at', $jsonUser);
		$this->assertObjectNotHasAttribute('login_at', $jsonUser);
	}
}