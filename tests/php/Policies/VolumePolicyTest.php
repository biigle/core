<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class VolumePolicyTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $project = ProjectTest::create();
        $this->volume = VolumeTest::create();
        $project->volumes()->attach($this->volume);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->expert = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $project->addUserId($this->guest->id, Role::$guest->id);
        $project->addUserId($this->editor->id, Role::$editor->id);
        $project->addUserId($this->expert->id, Role::$expert->id);
        $project->addUserId($this->admin->id, Role::$admin->id);
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->volume));
        $this->assertTrue($this->guest->can('access', $this->volume));
        $this->assertTrue($this->editor->can('access', $this->volume));
        $this->assertTrue($this->expert->can('access', $this->volume));
        $this->assertTrue($this->admin->can('access', $this->volume));
        $this->assertTrue($this->globalAdmin->can('access', $this->volume));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->volume));
        $this->assertFalse($this->guest->can('edit-in', $this->volume));
        $this->assertTrue($this->editor->can('edit-in', $this->volume));
        $this->assertTrue($this->expert->can('edit-in', $this->volume));
        $this->assertTrue($this->admin->can('edit-in', $this->volume));
        $this->assertTrue($this->globalAdmin->can('edit-in', $this->volume));
    }

    public function testForceEditIn()
    {
        $this->assertFalse($this->user->can('force-edit-in', $this->volume));
        $this->assertFalse($this->guest->can('force-edit-in', $this->volume));
        $this->assertFalse($this->editor->can('force-edit-in', $this->volume));
        $this->assertTrue($this->expert->can('force-edit-in', $this->volume));
        $this->assertTrue($this->admin->can('force-edit-in', $this->volume));
        $this->assertTrue($this->globalAdmin->can('force-edit-in', $this->volume));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->volume));
        $this->assertFalse($this->guest->can('update', $this->volume));
        $this->assertFalse($this->editor->can('update', $this->volume));
        $this->assertFalse($this->expert->can('update', $this->volume));
        $this->assertTrue($this->admin->can('update', $this->volume));
        $this->assertTrue($this->globalAdmin->can('update', $this->volume));
    }
}
