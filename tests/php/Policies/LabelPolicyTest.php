<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;

class LabelPolicyTest extends TestCase
{
    private $tree;
    private $label;
    private $user;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp(): void
    {
        parent::setUp();
        $this->tree = LabelTreeTest::create();
        $this->user = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
        $this->tree->addMember($this->editor, Role::editor());
        $this->tree->addMember($this->admin, Role::admin());
        $this->label = LabelTest::create(['label_tree_id' => $this->tree->id]);
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->label));
        $this->assertTrue($this->editor->can('update', $this->label));
        $this->assertTrue($this->admin->can('update', $this->label));
        $this->assertTrue($this->globalAdmin->can('update', $this->label));
    }

    public function testUpdateVersion()
    {
        $version = LabelTreeVersionTest::create(['label_tree_id' => $this->tree->id]);
        $this->tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->label->label_tree_id = $this->tree->id;
        $this->assertFalse($this->user->can('update', $this->label));
        $this->assertFalse($this->editor->can('update', $this->label));
        $this->assertFalse($this->admin->can('update', $this->label));
        $this->assertFalse($this->globalAdmin->can('update', $this->label));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->label));
        $this->assertTrue($this->editor->can('destroy', $this->label));
        $this->assertTrue($this->admin->can('destroy', $this->label));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->label));
    }

    public function testDestroyVersion()
    {
        $version = LabelTreeVersionTest::create(['label_tree_id' => $this->tree->id]);
        $this->tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->label->label_tree_id = $this->tree->id;
        $this->assertFalse($this->user->can('destroy', $this->label));
        $this->assertFalse($this->editor->can('destroy', $this->label));
        $this->assertFalse($this->admin->can('destroy', $this->label));
        $this->assertFalse($this->globalAdmin->can('destroy', $this->label));
    }
}
