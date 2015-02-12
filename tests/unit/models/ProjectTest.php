<?php

use Dias\Project;
use Dias\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;

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
		$project->users()->attach($user->id, array('role_id' => Role::adminId()));

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
		$project->users()->attach($admin->id, array('role_id' => Role::adminId()));
		$project->users()->attach($member->id, array('role_id' => Role::editorId()));
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
		$project->users()->attach($admin->id, array('role_id' => Role::adminId()));
		$project->users()->attach($member->id, array('role_id' => Role::editorId()));
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
		$project->users()->attach($admin->id, array('role_id' => Role::adminId()));
		$project->users()->attach($member->id, array('role_id' => Role::editorId()));
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
		
		$project->users()->attach($user->id, array('role_id' => Role::adminId()));

		$this->assertTrue($project->hasUser($user));
	}

	public function testHasUserId()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();

		$this->assertFalse($project->hasUserId($user->id));
		
		$project->users()->attach($user->id, array('role_id' => Role::adminId()));

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

	public function testAddUserId()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create();
		$user->save();
		$this->assertNull($project->users()->find($user->id));

		$project->addUserId($user->id, Role::editorId());
		$user = $project->users()->find($user->id);
		$this->assertNotNull($user);
		$this->assertEquals(Role::editorId(), $user->role_id);

		// a user can only be added once regardless the role
		$this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
		$project->addUserId($user->id, Role::adminId());
	}

	public function testRemoveUserId()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = UserTest::create();
		$admin->save();
		$project->addUserId($admin->id, Role::adminId());

		$this->assertNotNull($project->users()->find($admin->id));
		$this->assertTrue($project->removeUserId($admin->id));
		$this->assertNull($project->users()->find($admin->id));

		// the last admin mustn't be removed
		$this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
		$project->removeUserId($project->creator->id);
	}

	public function testChangeRole()
	{
		$project = ProjectTest::create();
		$project->save();
		$admin = $project->creator;
		$user = UserTest::create();
		$user->save();

		try {
			$project->changeRole($user->id, Role::adminId());
			// this shouldn't be reached
			$this->assertTrue(false);
		} catch (HttpException $e) {
			$this->assertNotNull($e);
		}

		$project->addUserId($user->id, Role::adminId());
		$this->assertEquals(Role::adminId(), $project->users()->find($user->id)->role_id);
		$project->changeRole($user->id, Role::editorId());
		$this->assertEquals(Role::editorId(), $project->users()->find($user->id)->role_id);

		// attempt to change the last admin to an editor
		$this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
		$project->changeRole($admin->id, Role::editorId());
	}

}