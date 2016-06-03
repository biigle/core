<?php

use Dias\Role;

class PoliciesLabelTreePolicyTest extends TestCase
{
    public function testAccess()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $tree->addMember($editor, Role::$editor);
        $tree->addMember($admin, Role::$admin);

        $this->assertFalse($user->can('access', $tree));
        $this->assertTrue($editor->can('access', $tree));
        $this->assertTrue($admin->can('access', $tree));
        $this->assertTrue($globalAdmin->can('access', $tree));
    }

    public function testAddLabelTo()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $tree->addMember($editor, Role::$editor);
        $tree->addMember($admin, Role::$admin);

        $this->assertFalse($user->can('addLabelTo', $tree));
        $this->assertTrue($editor->can('addLabelTo', $tree));
        $this->assertTrue($admin->can('addLabelTo', $tree));
        $this->assertTrue($globalAdmin->can('addLabelTo', $tree));
    }

    public function testRemoveLabelFrom()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $editor = UserTest::create();
        $admin = UserTest::create();
        $globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $tree->addMember($editor, Role::$editor);
        $tree->addMember($admin, Role::$admin);

        $this->assertFalse($user->can('removeLabelFrom', $tree));
        $this->assertTrue($editor->can('removeLabelFrom', $tree));
        $this->assertTrue($admin->can('removeLabelFrom', $tree));
        $this->assertTrue($globalAdmin->can('removeLabelFrom', $tree));
    }

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
