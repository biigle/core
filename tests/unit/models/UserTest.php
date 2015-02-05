<?php

use Dias\User;

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
		$user = UserTest::create();
		$user->firstname = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->save();
	}

	public function testLastnameRequired()
	{
		$user = UserTest::create();
		$user->lastname = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->save();
	}

	public function testPasswordRequired()
	{
		$user = UserTest::create();
		$user->password = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->save();
	}

	public function testEmailRequired()
	{
		$user = UserTest::create();
		$user->email = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->save();
	}

	public function testEmailUnique()
	{
		$user = UserTest::create();
		$user->save();
		$user = UserTest::create('jane', 'users', 'pwd');
		$this->setExpectedException('Illuminate\Database\QueryException');
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
		$guestRole = RoleTest::create('guest');
		$guestRole->save();
		$project->users()->attach(
			$user->id,
			array('role_id' => $memberRole->id)
		);

		$this->assertTrue($user->hasRoleInProject($memberRole, $project));
		$this->assertFalse($user->hasRoleInProject($guestRole, $project));
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

	public function testAttributeRelation()
	{
		$user = UserTest::create();
		$user->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$user->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->assertEquals(1, $user->attributes()->count());

		$attribute = $user->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}
}