<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class VolumePolicyTest extends TestCase
{
    private $volume;
    private $user;
    private $guest;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $this->project = ProjectTest::create();
        $this->volume = VolumeTest::create();
        $this->project->volumes()->attach($this->volume);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);

        $this->otherProject = ProjectTest::create();
        $this->otherAdmin = UserTest::create();
        $this->otherProject->volumes()->attach($this->volume);
        $this->otherProject->addUserId($this->otherAdmin->id, Role::$admin->id);
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->volume));
        $this->assertTrue($this->guest->can('access', $this->volume));
        $this->assertTrue($this->editor->can('access', $this->volume));
        $this->assertTrue($this->admin->can('access', $this->volume));
        $this->assertTrue($this->globalAdmin->can('access', $this->volume));

        $this->markTestIncomplete('Update volume access similar to label trees');
    }

    public function testAccessThroughProject()
    {
        $this->assertFalse($this->user->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertFalse($this->user->can('access-through-project', [$this->volume, $this->otherProject->id]));
        $this->assertTrue($this->guest->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->editor->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->admin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->globalAdmin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertFalse($this->otherAdmin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->otherAdmin->can('access-through-project', [$this->volume, $this->otherProject->id]));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->volume));
        $this->assertFalse($this->guest->can('edit-in', $this->volume));
        $this->assertTrue($this->editor->can('edit-in', $this->volume));
        $this->assertTrue($this->admin->can('edit-in', $this->volume));
        $this->assertTrue($this->globalAdmin->can('edit-in', $this->volume));

        $this->markTestIncomplete('Update volume access similar to label trees');
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->volume));
        $this->assertFalse($this->guest->can('update', $this->volume));
        $this->assertFalse($this->editor->can('update', $this->volume));
        $this->assertTrue($this->admin->can('update', $this->volume));
        $this->assertTrue($this->globalAdmin->can('update', $this->volume));

        $this->markTestIncomplete('Update volume access similar to label trees');
    }
}
