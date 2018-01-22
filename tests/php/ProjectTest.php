<?php

namespace Biigle\Tests;

use Biigle\Role;
use Biigle\Project;
use ModelTestCase;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProjectTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Project::class;

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

    public function testVolumes()
    {
        $volume = VolumeTest::make();
        $this->model->volumes()->save($volume);
        $this->assertEquals($volume->id, $this->model->volumes()->first()->id);
        $this->assertEquals(1, $this->model->volumes()->count());
        $pivot = $this->model->volumes()->first()->pivot;
        $this->assertInstanceOf(\Biigle\ProjectVolume::class, $pivot);
        $this->assertNotNull($pivot->id);
        $this->assertNotNull($pivot->created_at);
        $this->assertNotNull($pivot->updated_at);
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

    public function testDetachVolume()
    {
        $volume = VolumeTest::create();
        $this->model->volumes()->attach($volume);

        $this->model->detachVolume($volume);
        $this->assertFalse($this->model->volumes()->exists());
        $this->assertNotNull($volume->fresh());

        // try {
        //     // trying to detach a volume belonging to only one project fails
        //     // without force
        //     $this->model->detachVolume($volume);
        //     $this->assertFalse(true);
        // } catch (HttpException $e) {
        //     $this->assertNotNull($e);
        // }

        // // use the force to detach and delete the volume
        // $this->model->detachVolume($volume, true);
        // $this->assertNull($volume->fresh());
        $this->markTestIncomplete('Require force if annotations would be deleted.');
    }

    public function testDetachAllVolumes()
    {
        $volume = VolumeTest::create();
        $this->model->volumes()->attach($volume);

        $this->model->detachAllVolumes();
        $this->assertFalse($this->model->volumes()->exists());
        $this->assertNotNull($volume->fresh());

        // try {
        //     // trying to detach a volume belonging to only one project fails
        //     // without force
        //     $this->model->detachAllVolumes();
        //     $this->assertFalse(true);
        // } catch (HttpException $e) {
        //     $this->assertNotNull($e);
        // }

        // // use the force to detach and delete the volume
        // $this->model->detachAllVolumes(true);
        // $this->assertNull($volume->fresh());
        $this->markTestIncomplete('Require force if annotations would be deleted.');
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
        $this->model->addVolumeId($i1->volume_id);
        $this->model->addVolumeId($i2->volume_id);

        $this->assertEquals($i1->uuid, $this->model->thumbnail->uuid);
    }
}
