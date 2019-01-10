<?php

namespace Biigle\Tests;

use TestCase;
use Biigle\Role;
use Illuminate\Database\QueryException;

class ProjectUserIntegrityTest extends TestCase
{
    public function testRoleOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $role = RoleTest::create();
        $project->addUserId(UserTest::create()->id, $role->id);
        $this->expectException(QueryException::class);
        $role->delete();
    }

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $project->addUserId($user->id, RoleTest::create()->id);

        $this->assertEquals(1, $user->projects()->count());
        $project->delete();
        $this->assertEquals(0, $user->projects()->count());
    }

    public function testUserOnDeleteCascade()
    {
        $member = UserTest::create();
        $project = ProjectTest::create();
        $project->addUserId($member->id, Role::guestId());

        // count the project creator, too
        $this->assertEquals(2, $project->users()->count());
        $member->delete();
        $this->assertEquals(1, $project->users()->count());
    }

    public function testUserProjectRoleUnique()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $role = RoleTest::create();
        $project->addUserId($user->id, $role->id);
        $this->expectException(QueryException::class);
        // attach manually so the error-check in addUserId is circumvented
        $project->users()->attach($user->id, ['project_role_id' => $role->id]);
    }
}
