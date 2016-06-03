<?php

use Dias\Role;

class PoliciesProjectPolicyTest extends TestCase
{
    private $project;
    private $user;
    private $guest;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $this->project = ProjectTest::create();
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->project));
        $this->assertTrue($this->guest->can('access', $this->project));
        $this->assertTrue($this->editor->can('access', $this->project));
        $this->assertTrue($this->admin->can('access', $this->project));
        $this->assertTrue($this->globalAdmin->can('access', $this->project));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->project));
        $this->assertFalse($this->guest->can('edit-in', $this->project));
        $this->assertTrue($this->editor->can('edit-in', $this->project));
        $this->assertTrue($this->admin->can('edit-in', $this->project));
        $this->assertTrue($this->globalAdmin->can('edit-in', $this->project));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->project));
        $this->assertFalse($this->guest->can('update', $this->project));
        $this->assertFalse($this->editor->can('update', $this->project));
        $this->assertTrue($this->admin->can('update', $this->project));
        $this->assertTrue($this->globalAdmin->can('update', $this->project));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->project));
        $this->assertFalse($this->guest->can('destroy', $this->project));
        $this->assertFalse($this->editor->can('destroy', $this->project));
        $this->assertTrue($this->admin->can('destroy', $this->project));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->project));
    }
}
