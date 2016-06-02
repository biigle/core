<?php

use Dias\Role;

class PoliciesLabelTreePolicyTest extends TestCase
{
    public function testUpdate()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $tree->addMember($editor, Role::$editor);
        $tree->addMember($admin, Role::$admin);

        $this->assertFalse($user->can('update', $tree));
        $this->assertFalse($editor->can('update', $tree));
        $this->assertTrue($admin->can('update', $tree));
        $this->assertTrue($globalAdmin->can('update', $tree));
    }

    public function testDestroy()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $tree->addMember($editor, Role::$editor);
        $tree->addMember($admin, Role::$admin);

        $this->assertFalse($user->can('destroy', $tree));
        $this->assertFalse($editor->can('destroy', $tree));
        $this->assertTrue($admin->can('destroy', $tree));
        $this->assertTrue($globalAdmin->can('destroy', $tree));
    }
}
