<?php

use Dias\Project;

class ProjectTest extends TestCase {

	public static function create($name = 'test', $desc = 'test', $user = false)
	{
		$project = new Project;
		$project->name = $name;
		$project->description = $desc;
		$creator = ($user) ? $user : UserTest::create();
		$creator->save();
		$project->creator()->associate($creator);
		return $project;
	}

	public function testCreation()
	{
		$project = ProjectTest::create();
		$this->assertTrue($project->save());
	}

	public function testAttributes()
	{
		$creator = UserTest::create();
		$creator->save();
		$project = ProjectTest::create('test', 'test', $creator);
		$project->save();
		$this->assertNotNull($project->name);
		$this->assertNotNull($project->description);
		$this->assertNotNull($project->creator_id);
		$this->assertNotNull($project->created_at);
		$this->assertNotNull($project->updated_at);
	}

	public function testHiddenAttributes()
	{
		$project = ProjectTest::create();
		$jsonProject = json_decode((string) $project);
		$this->assertObjectNotHasAttribute('pivot', $jsonProject);
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

	public function testCreatorNullable()
	{
		$project = ProjectTest::create();
		$project->save();
		$project->creator()->dissociate();
		$this->assertEquals(null, $project->creator_id);
	}

	public function testCreatorOnDeleteSetNull()
	{
		$project = ProjectTest::create();
		$project->save();
		$project->creator()->delete();
		$this->assertEquals(null, $project->fresh()->creator);
	}

	public function testCreator()
	{
		$creator = UserTest::create();
		$creator->save();
		$project = ProjectTest::create('test', 'test', $creator);
		$project->save();

		$this->assertEquals($creator->id, $project->creator->id);
		// creator will be user as well
		$this->assertEquals($creator->id, $project->users()->first()->id);
	}

	public function testSetCreator()
	{
		$user = UserTest::create();
		$user->save();
		$project = ProjectTest::create();
		$project->save();
		// remove real creator to mock a new project
		$project->creator()->dissociate();

		$this->assertNull($project->creator);
		$this->assertTrue($project->setCreator($user));
		// creator con only be set once
		$this->assertFalse($project->setCreator($user));
		$project->save();
		$this->assertEquals($user->id, $project->fresh()->creator->id);
	}

	public function testUsers()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$project->users()->attach($user->id, array('role_id' => 1));

		$this->assertNotNull($project->users()->find($user->id));
	}

	public function testAdmins()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = UserTest::create();
		$admin->save();
		$member = UserTest::create();
		$member->save();
		$project->users()->attach($admin->id, array('role_id' => 1));
		$project->users()->attach($member->id, array('role_id' => 2));
		// the creator doesn't count
		$project->creator->delete();
		
		$this->assertEquals(2, $project->users()->count());
		$this->assertEquals(1, $project->admins()->count());
	}

	public function testHasAdmin()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = UserTest::create();
		$admin->save();
		$member = UserTest::create();
		$member->save();
		// admin role is inserted by migration
		$project->users()->attach($admin->id, array('role_id' => 1));
		$project->users()->attach($member->id, array('role_id' => 2));
		$this->assertTrue($project->hasAdmin($admin));
		$this->assertFalse($project->hasAdmin($member));
	}

	public function testHasAdminId()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = UserTest::create();
		$admin->save();
		$member = UserTest::create();
		$member->save();
		// admin role is inserted by migration
		$project->users()->attach($admin->id, array('role_id' => 1));
		$project->users()->attach($member->id, array('role_id' => 2));
		$this->assertTrue($project->hasAdminId($admin->id));
		$this->assertFalse($project->hasAdminId($member->id));
	}

	public function testHasUser()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();

		$this->assertFalse($project->hasUser($user));
		
		$project->users()->attach($user->id, array('role_id' => 1));

		$this->assertTrue($project->hasUser($user));
	}

	public function testHasUserId()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();

		$this->assertFalse($project->hasUserId($user->id));
		
		$project->users()->attach($user->id, array('role_id' => 1));

		$this->assertTrue($project->hasUserId($user->id));
	}

	public function testTransects()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
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