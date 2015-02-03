<?php

class UserTest extends TestCase {

	public static function create($fn = 'joe', $ln = 'user', $pw = 'pw', $mail = 'm@m.mm')
	{
		$user = new User;
		$user->firstname = $fn;
		$user->lastname = $ln;
		$user->password = Hash::make($pw);
		$user->email = $mail;
		return $user;
	}

	public function testCreation()
	{
		$user = UserTest::create();
		$this->assertTrue($user->save());
	}

	public function testAttributes()
	{
		$user = UserTest::create();
		$user->save();
		$this->assertNotNull($user->firstname);
		$this->assertNotNull($user->lastname);
		$this->assertNotNull($user->password);
		$this->assertNotNull($user->email);
		$this->assertNotNull($user->created_at);
		$this->assertNotNull($user->updated_at);
	}

	public function testFirstnameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::create();
		$user->firstname = null;
		$user->save();
	}

	public function testLastnameRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::create();
		$user->lastname = null;
		$user->save();
	}

	public function testPasswordRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::create();
		$user->password = null;
		$user->save();
	}

	public function testEmailRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user = UserTest::create();
		$user->email = null;
		$user->save();
	}

	public function testEmailUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$user = UserTest::create();
		$user->save();
		$user = UserTest::create('jane', 'users', 'pwd');
		$user->save();
	}

	public function testProjects()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'a@b.c');
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$this->assertEquals($user->projects()->first()->id, $project->id);
	}

	public function testCreatedProjects()
	{
		$user = UserTest::create();
		$user->save();
		$project = ProjectTest::create('test', 'test', $user);
		$project->save();
		$project2 = ProjectTest::create('test2', 'test2', $user);
		$project2->save();

		$this->assertEquals($project->id, $user->createdProjects()->first()->id);
		$this->assertEquals(2, $user->createdProjects()->count());
	}

	public function testHasRoleInProject()
	{
		$user = UserTest::create('a', 'b', 'c', 'd');
		$user->save();
		$project = ProjectTest::create();
		$project->save();
		$memberRole = RoleTest::create('member');
		$memberRole->save();
		$adminRole = RoleTest::create('admin');
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
		$user = UserTest::create();
		$jsonUser = json_decode((string) $user);
		$this->assertObjectNotHasAttribute('password', $jsonUser);
		$this->assertObjectNotHasAttribute('email', $jsonUser);
		$this->assertObjectNotHasAttribute('remember_token', $jsonUser);
		$this->assertObjectNotHasAttribute('created_at', $jsonUser);
		$this->assertObjectNotHasAttribute('updated_at', $jsonUser);
		$this->assertObjectNotHasAttribute('login_at', $jsonUser);
	}
}