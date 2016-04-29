<?php

use Dias\Project;
use Dias\Role;
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
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testDescriptionRequired()
    {
        $this->model->description = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
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

    public function testLabels()
    {
        $this->assertEmpty($this->model->labels()->get());
        LabelTest::create(['project_id' => $this->model->id]);
        $this->assertNotEmpty($this->model->labels()->get());
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
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
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
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->removeUserId($this->model->creator->id);
    }

    public function testCheckUserCanBeRemoved()
    {
        $user = UserTest::create();
        $this->model->addUserId($user->id, Role::$editor->id);
        $this->model->checkUserCanBeRemoved($user->id);
        // the last admin mustn't be removed
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
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
        $this->setExpectedException('Symfony\Component\HttpKernel\Exception\HttpException');
        $this->model->changeRole($admin->id, Role::$editor->id);
    }

    public function testAddTransect()
    {
        $transect = TransectTest::create();
        $this->assertEquals(0, $this->model->transects()->count());
        $this->model->addTransectId($transect->id);
        $this->assertEquals(1, $this->model->transects()->count());

        // transect shouldn't be added again but the QueryException shouldn't
        // be trown up either
        $this->model->addTransectId($transect->id);
        $this->assertEquals(1, $this->model->transects()->count());
    }

    public function testRemoveTransect()
    {
        $secondProject = self::create();
        $secondProject->save();
        $transect = TransectTest::create();
        $this->model->addTransectId($transect->id);
        $secondProject->addTransectId($transect->id);

        $this->assertNotEmpty($secondProject->fresh()->transects);
        $secondProject->removeTransectId($transect->id);
        $this->assertEmpty($secondProject->fresh()->transects);

        try {
            // trying to detach a transect belonging to only one project fails
            // without force
            $this->model->removeTransectId($transect->id);
            $this->assertFalse(true);
        } catch (HttpException $e) {
            $this->assertNotNull($e);
        }

        // use the force to detach and delete the transect
        $this->model->removeTransectId($transect->id, true);
        $this->assertNull($transect->fresh());
    }

    public function testRemoveAllTransects()
    {
        $secondProject = self::create();
        $secondProject->save();
        $transect = TransectTest::create();
        $this->model->addTransectId($transect->id);
        $secondProject->addTransectId($transect->id);

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
}
