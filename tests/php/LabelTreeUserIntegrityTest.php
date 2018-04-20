<?php

namespace Biigle\Tests;

use TestCase;
use Biigle\Role;
use Illuminate\Database\QueryException;

class LabelTreeUserIntegrityTest extends TestCase
{
    public function testRoleOnDeleteRestrict()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember(UserTest::create(), Role::$editor);
        $this->expectException(QueryException::class);
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

        $this->expectException(QueryException::class);
        $tree->members()->attach($user->id, ['role_id' => Role::$editor->id]);
    }
}
