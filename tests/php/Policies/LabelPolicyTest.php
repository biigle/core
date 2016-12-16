<?php

namespace Dias\Tests\Policies;

use TestCase;
use Dias\Role;
use Dias\Tests\UserTest;
use Dias\Tests\LabelTest;
use Dias\Tests\LabelTreeTest;

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
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);
        $tree->addMember($this->editor, Role::$editor);
        $tree->addMember($this->admin, Role::$admin);
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
