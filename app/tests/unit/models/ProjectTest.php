<?php

class ProjectTest extends TestCase {

	public static function create($name = 'test', $desc = 'test', $user = false)
	{
		$user = $user ? $user : UserTest::create();
		$user->save();
		$project = new Project;
		$project->name = $name;
		$project->description = $desc;
		$project->creator()->associate($user);
		return $project;
	}

	public function testCreation()
	{
		$project = ProjectTest::create();
		$this->assertTrue($project->save());
	}

	public function testAttributes()
	{
		$project = ProjectTest::create();
		$project->save();
		$this->assertNotNull($project->name);
		$this->assertNotNull($project->description);
		$this->assertNotNull($project->creator_id);
		$this->assertNotNull($project->created_at);
		$this->assertNotNull($project->updated_at);
	}

	public function testNameRequired()
	{
		$project = ProjectTest::create();
		$project->name = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project->save();
	}

	public function testDescriptionRequired()
	{
		$project = ProjectTest::create();
		$project->description = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$project->save();
	}

	public function testUserNullable()
	{
		$project = ProjectTest::create();
		$project->save();
		$project->creator()->dissociate();
		$this->assertEquals(null, $project->creator_id);
	}

	public function testUserOnDeleteSetNull()
	{
		$project = ProjectTest::create();
		$project->save();
		$project->creator()->delete();
		// refresh project object
		$project = Project::find($project->id);
		$this->assertEquals(null, $project->creator);
	}

	public function testCreator()
	{
		$project = ProjectTest::create();
		$this->assertEquals(User::find(1)->id, $project->creator->id);
	}

	public function testAssociateUsers()
	{
		$project = ProjectTest::create();
		$project->save();
		$u1 = UserTest::create('a', 'b', 'c', 'a@b.c');
		$u1->save();
		$role = RoleTest::create();
		$role->save();
		$project->users()->attach($u1->id, array('role_id' => $role->id));

		$user = $project->users()->first();
		$this->assertEquals($u1->id, $user->id);
	}

	public function testUserRoles()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = UserTest::create('a', 'b', 'c', 'a@b.c');
		$admin->save();
		$member = UserTest::create('a', 'b', 'c', 'a@d.c');
		$member->save();
		$role = RoleTest::create('admin');
		$role->save();
		$project->users()->attach($admin->id, array('role_id' => $role->id));
		$role = RoleTest::create('member');
		$role->save();
		$project->users()->attach($member->id, array('role_id' => $role->id));

		$user = $project->usersWithRole('admin')->first();
		$this->assertEquals($admin->id, $user->id);
		$user = $project->usersWithRole('member')->first();
		$this->assertEquals($member->id, $user->id);
	}

	public function testTransects()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('jane', 'user', 'pw', 'u@b.com');
		$user->save();
		$transect = TransectTest::create('test', null, null, $user);
		$transect->save();

		$project->transects()->attach($transect->id);
		$this->assertEquals($transect->id, $project->transects()->first()->id);
		$this->assertEquals(1, $project->transects()->count());
	}

	public function testAttributeRelation()
	{
		$project = ProjectTest::create();
		$project->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$project->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->assertEquals(1, $project->attributes()->count());

		$attribute = $project->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}

}