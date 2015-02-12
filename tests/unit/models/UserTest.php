<?php

use Dias\User;
use Dias\Role;

class UserTest extends TestCase {

	public static function create($fn = 'joe', $ln = 'user', $pw = 'pw', $mail = false)
	{
		$user = new User;
		$user->firstname = $fn;
		$user->lastname = $ln;
		$user->password = bcrypt($pw);
		$user->email = ($mail) ? $mail : str_random(10);
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
		$this->assertNotNull($user->role_id);
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
		$user = UserTest::create('joe', 'user', 'pw', 'test@test.com');
		$user->save();
		$user = UserTest::create('joe', 'user', 'pw', 'test@test.com');
		$this->setExpectedException('Illuminate\Database\QueryException');
		$user->save();
	}

	public function testProjects()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($user->id, array('role_id' => $role->id));

		$this->assertEquals($user->projects()->first()->id, $project->id);
	}

	public function testRole()
	{
		$user = UserTest::create();
		$user->save();
		$role = $user->role;
		$this->assertNotNull($role);
		$this->assertEquals(Role::editorId(), $role->id);
	}

	public function testHiddenAttributes()
	{
		$user = UserTest::create();
		// API key mustn't show up in the JSON
		$user->generateAPIKey();
		$jsonUser = json_decode((string) $user);
		$this->assertObjectNotHasAttribute('password', $jsonUser);
		$this->assertObjectNotHasAttribute('email', $jsonUser);
		$this->assertObjectNotHasAttribute('remember_token', $jsonUser);
		$this->assertObjectNotHasAttribute('created_at', $jsonUser);
		$this->assertObjectNotHasAttribute('updated_at', $jsonUser);
		$this->assertObjectNotHasAttribute('login_at', $jsonUser);
		$this->assertObjectNotHasAttribute('api_key', $jsonUser);
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

	public function testAPIKey()
	{
		$user = UserTest::create();
		$user->save();
		$this->assertNull($user->api_key);
		$key = $user->generateAPIKey();
		$this->assertEquals($key, $user->fresh()->api_key);
	}
}