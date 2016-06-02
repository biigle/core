<?php

use Dias\Role;

class PoliciesProjectPolicyTest extends TestCase
{
    public function testAccess()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $guest = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($guest->id, Role::$guest->id);
        $project->addUserId($editor->id, Role::$editor->id);
        $project->addUserId($admin->id, Role::$admin->id);

        $this->assertFalse($user->can('access', $project));
        $this->assertTrue($guest->can('access', $project));
        $this->assertTrue($editor->can('access', $project));
        $this->assertTrue($admin->can('access', $project));
        $this->assertTrue($globalAdmin->can('access', $project));
    }

    public function testEditIn()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $guest = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($guest->id, Role::$guest->id);
        $project->addUserId($editor->id, Role::$editor->id);
        $project->addUserId($admin->id, Role::$admin->id);

        $this->assertFalse($user->can('editIn', $project));
        $this->assertFalse($guest->can('editIn', $project));
        $this->assertTrue($editor->can('editIn', $project));
        $this->assertTrue($admin->can('editIn', $project));
        $this->assertTrue($globalAdmin->can('editIn', $project));
    }

    public function testUpdate()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $guest = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($guest->id, Role::$guest->id);
        $project->addUserId($editor->id, Role::$editor->id);
        $project->addUserId($admin->id, Role::$admin->id);

        $this->assertFalse($user->can('update', $project));
        $this->assertFalse($guest->can('update', $project));
        $this->assertFalse($editor->can('update', $project));
        $this->assertTrue($admin->can('update', $project));
        $this->assertTrue($globalAdmin->can('update', $project));
    }

    public function testDestroy()
    {
        $project = ProjectTest::create();
        $user = UserTest::create();
        $guest = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($guest->id, Role::$guest->id);
        $project->addUserId($editor->id, Role::$editor->id);
        $project->addUserId($admin->id, Role::$admin->id);

        $this->assertFalse($user->can('destroy', $project));
        $this->assertFalse($guest->can('destroy', $project));
        $this->assertFalse($editor->can('destroy', $project));
        $this->assertTrue($admin->can('destroy', $project));
        $this->assertTrue($globalAdmin->can('destroy', $project));
    }
}
