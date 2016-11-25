<?php

use Dias\Role;
use Dias\Project;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProjectTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Project::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->creator_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testHiddenAttributes()
    {
        $jsonProject = json_decode((string) $this->model);
        $this->assertObjectNotHasAttribute('pivot', $jsonProject);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException(QueryException::class);
        $this->model->save();
    }

    public function testDescriptionRequired()
    {
        $this->model->description = null;
        $this->setExpectedException(QueryException::class);
        $this->model->save();
    }

    public function testCreatorNullable()
    {
        $this->model->creator()->dissociate();
        $this->model->save();
        $this->assertEquals(null, $this->model->creator_id);
    }

    public function testCreatorOnDeleteSetNull()
    {
        $this->model->creator()->delete();
        $this->assertEquals(null, $this->model->fresh()->creator);
    }

    public function testCreator()
    {
        // creator will be user as well
        $this->assertEquals($this->model->creator->id, $this->model->users()->first()->id);
    }

    public function testSetCreator()
    {
        $user = UserTest::create();
        // remove real creator to mock a new project
        $this->model->creator()->dissociate();

        $this->assertNull($this->model->creator);
        $this->assertTrue($this->model->setCreator($user));
        // creator can only be set once
        $this->assertFalse($this->model->setCreator($user));
        $this->model->save();
        $this->assertEquals($user->id, $this->model->fresh()->creator->id);
    }

    public function testUsers()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::$admin->id);

        $this->assertNotNull($this->model->users()->find($user->id));
    }

    public function testAdmins()
    {
        $admin = UserTest::create();
        $member = UserTest::create();
        $this->model->addUserId($admin->id, Role::$admin->id);
        $this->model->addUserId($member->id, Role::$editor->id);
        // the creator doesn't count
        $this->model->creator->delete();

        $this->assertEquals(2, $this->model->users()->count());
        $this->assertEquals(1, $this->model->admins()->count());
    }

    public function testEditors()
    {
        $editor = UserTest::create();
        $member = UserTest::create();
        $this->model->addUserId($editor->id, Role::$editor->id);
        $this->model->addUserId($member->id, Role::$guest->id);

        // count the project creator, too
        $this->assertEquals(3, $this->model->users()->count());
        $this->assertEquals(1, $this->model->editors()->count());
    }

    public function testGuests()
    {
        $member = UserTest::create();
        $this->model->addUserId($member->id, Role::$guest->id);

        // count the project creator, too
        $this->assertEquals(2, $this->model->users()->count());
        $this->assertEquals(1, $this->model->guests()->count());
    }

    public function testTransects()
    {
        $transect = TransectTest::make();
        $this->model->transects()->save($transect);
        $this->assertEquals($transect->id, $this->model->transects()->first()->id);
        $this->assertEquals(1, $this->model->transects()->count());
    }

    public function testAddUserId()
    {
        $user = UserTest::create();
        $this->assertNull($this->model->users()->find($user->id));

        $this->model->addUserId($user->id, Role::$editor->id);
        $user = $this->model->users()->find($user->id);
        $this->assertNotNull($user);
        $this->assertEquals(Role::$editor->id, $user->project_role_id);

        // a user can only be added once regardless the role
        $this->setExpectedException(HttpException::class);
        $this->model->addUserId($user->id, Role::$admin->id);
    }

    public function testRemoveUserId()
    {
        $admin = UserTest::create();
        $this->model->addUserId($admin->id, Role::$admin->id);
        $this->assertNotNull($this->model->users()->find($admin->id));
        $this->assertTrue($this->model->removeUserId($admin->id));
        $this->assertNull($this->model->users()->find($admin->id));

        // the last admin mustn't be removed
        $this->setExpectedException(HttpException::class);
        $this->model->removeUserId($this->model->creator->id);
    }

    public function testCheckUserCanBeRemoved()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::$editor->id);
        $this->model->checkUserCanBeRemoved($user->id);
        // the last admin mustn't be removed
        $this->setExpectedException(HttpException::class);
        $this->model->checkUserCanBeRemoved($this->model->creator->id);
    }

    public function testChangeRole()
    {
        $admin = $this->model->creator;
        $user = UserTest::create();

        try {
            $this->model->changeRole($user->id, Role::$admin->id);
            // this shouldn't be reached
            $this->assertTrue(false);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        $this->model->addUserId($user->id, Role::$admin->id);
        $this->assertEquals(Role::$admin->id, $this->model->users()->find($user->id)->project_role_id);
        $this->model->changeRole($user->id, Role::$editor->id);
        $this->assertEquals(Role::$editor->id, $this->model->users()->find($user->id)->project_role_id);

        // attempt to change the last admin to an editor
        $this->setExpectedException(HttpException::class);
        $this->model->changeRole($admin->id, Role::$editor->id);
    }

    public function testRemoveTransect()
    {
        $secondProject = self::create();
        $secondProject->save();
        $transect = TransectTest::create();
        $this->model->transects()->attach($transect);
        $secondProject->transects()->attach($transect);

        $this->assertNotEmpty($secondProject->fresh()->transects);
        $secondProject->removeTransect($transect);
        $this->assertEmpty($secondProject->fresh()->transects);

        try {
            // trying to detach a transect belonging to only one project fails
            // without force
            $this->model->removeTransect($transect);
            $this->assertFalse(true);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        // use the force to detach and delete the transect
        $this->model->removeTransect($transect, true);
        $this->assertNull($transect->fresh());
    }

    public function testRemoveAllTransects()
    {
        $secondProject = self::create();
        $secondProject->save();
        $transect = TransectTest::create();
        $this->model->transects()->attach($transect);
        $secondProject->transects()->attach($transect);

        $this->assertNotEmpty($secondProject->fresh()->transects);
        $secondProject->removeAllTransects();
        $this->assertEmpty($secondProject->fresh()->transects);

        try {
            // trying to detach a transect belonging to only one project fails
            // without force
            $this->model->removeAllTransects();
            $this->assertFalse(true);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        // use the force to detach and delete the transect
        $this->model->removeAllTransects(true);
        $this->assertNull($transect->fresh());
    }

    public function testLabelTrees()
    {
        $count = $this->model->labelTrees()->count();
        LabelTreeTest::create()->projects()->attach($this->model->id);
        $this->assertEquals($count + 1, $this->model->labelTrees()->count());
    }

    public function testAuthorizedLabelTrees()
    {
        $this->assertFalse($this->model->authorizedLabelTrees()->exists());
        LabelTreeTest::create()->authorizedProjects()->attach($this->model->id);
        $this->assertTrue($this->model->authorizedLabelTrees()->exists());
    }

    public function testDefaultLabelTrees()
    {
        // tree has no members so it is global
        $tree = LabelTreeTest::create();
        $project = self::create();
        $this->assertTrue($project->labelTrees()->exists());
        $this->assertTrue($project->labelTrees()->where('id', $tree->id)->exists());
    }

    public function testGetThumbnailAttributeNull()
    {
        $this->assertEquals(null, $this->model->thumbnail);
    }

    public function testGetThumbnailAttribute()
    {
        $i1 = ImageTest::create();
        $i2 = ImageTest::create();
        $this->model->addTransectId($i1->transect_id);
        $this->model->addTransectId($i2->transect_id);

        $this->assertEquals($i1->uuid, $this->model->thumbnail->uuid);
    }
}
