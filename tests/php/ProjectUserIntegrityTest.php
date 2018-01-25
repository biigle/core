<?php

namespace Biigle\Tests;

use TestCase;
use Biigle\Role;

class ProjectUserIntegrityTest extends TestCase
{
    public function testRoleOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $role = Role::$guest;
        $project->addUserId(UserTest::create()->id, $role->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $role->delete();
    }

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $project->addUserId($user->id, Role::$guest->id);

        $this->assertEquals(1, $user->projects()->count());
        $project->delete();
        $this->assertEquals(0, $user->projects()->count());
    }

    public function testUserOnDeleteCascade()
    {
        $member = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($member->id, Role::$guest->id);

        // count the project creator, too
        $this->assertEquals(2, $project->users()->count());
        $member->delete();
        $this->assertEquals(1, $project->users()->count());
    }

    public function testUserProjectRoleUnique()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $role = Role::$guest;
        $project->addUserId($user->id, $role->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        // attach manually so the error-check in addUserId is circumvented
        $project->users()->attach($user->id, ['role_id' => $role->id]);
    }
}
