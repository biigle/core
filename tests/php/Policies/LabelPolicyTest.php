<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;

class LabelPolicyTest extends TestCase
{
    private $label;
    private $user;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $tree = LabelTreeTest::create();
        $this->user = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
        $tree->addMember($this->editor, Role::editor());
        $tree->addMember($this->admin, Role::admin());
        $this->label = LabelTest::create(['label_tree_id' => $tree->id]);
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->label));
        $this->assertTrue($this->editor->can('update', $this->label));
        $this->assertTrue($this->admin->can('update', $this->label));
        $this->assertTrue($this->globalAdmin->can('update', $this->label));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->label));
        $this->assertTrue($this->editor->can('destroy', $this->label));
        $this->assertTrue($this->admin->can('destroy', $this->label));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->label));
    }
}
