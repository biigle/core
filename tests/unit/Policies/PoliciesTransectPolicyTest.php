<?php

use Dias\Role;

class PoliciesTransectPolicyTest extends TestCase
{
    private $transect;
    private $user;
    private $guest;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $project = ProjectTest::create();
        $this->transect = TransectTest::create();
        $project->transects()->attach($this->transect);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($this->guest->id, Role::$guest->id);
        $project->addUserId($this->editor->id, Role::$editor->id);
        $project->addUserId($this->admin->id, Role::$admin->id);
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->transect));
        $this->assertTrue($this->guest->can('access', $this->transect));
        $this->assertTrue($this->editor->can('access', $this->transect));
        $this->assertTrue($this->admin->can('access', $this->transect));
        $this->assertTrue($this->globalAdmin->can('access', $this->transect));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->transect));
        $this->assertFalse($this->guest->can('edit-in', $this->transect));
        $this->assertTrue($this->editor->can('edit-in', $this->transect));
        $this->assertTrue($this->admin->can('edit-in', $this->transect));
        $this->assertTrue($this->globalAdmin->can('edit-in', $this->transect));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->transect));
        $this->assertFalse($this->guest->can('update', $this->transect));
        $this->assertFalse($this->editor->can('update', $this->transect));
        $this->assertTrue($this->admin->can('update', $this->transect));
        $this->assertTrue($this->globalAdmin->can('update', $this->transect));
    }
}
