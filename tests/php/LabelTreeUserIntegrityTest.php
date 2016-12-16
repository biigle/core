<?php

namespace Dias\Tests;

use TestCase;
use Dias\Role;

class LabelTreeUserIntegrityTest extends TestCase
{
    public function testRoleOnDeleteRestrict()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::$editor);
        $this->setExpectedException('Illuminate\Database\QueryException');
        Role::$editor->delete();
    }

    public function testLabelTreeOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::$editor);

        $this->assertTrue($user->labelTrees()->exists());
        $tree->delete();
        $this->assertFalse($user->labelTrees()->exists());
    }

    public function testUserOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::$editor);

        $this->assertTrue($tree->members()->exists());
        $user->delete();
        $this->assertFalse($tree->members()->exists());
    }

    public function testUserLabelTreeUnique()
    {
        $tree = LabelTreeTest::create();
        $user = UserTest::create();
        $tree->addMember($user, Role::$editor);

        $this->setExpectedException('Illuminate\Database\QueryException');
        $tree->members()->attach($user->id, ['role_id' => Role::$editor->id]);
    }
}
