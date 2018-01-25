<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;

class VolumePolicyTest extends TestCase
{
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

    public function testAccessPublic()
    {
        $this->assertTrue($this->user->can('access', $this->volume));
        $this->assertTrue($this->guest->can('access', $this->volume));
        $this->assertTrue($this->editor->can('access', $this->volume));
        $this->assertTrue($this->admin->can('access', $this->volume));
        $this->assertTrue($this->globalAdmin->can('access', $this->volume));
    }

    public function testAccessPrivate()
    {
        $this->volume->visibility_id = Visibility::$private->id;
        $this->project->volumes()->detach($this->volume);
        $this->volume->addMember($this->user, Role::$admin);
        $this->assertTrue($this->user->can('access', $this->volume));
        $this->assertFalse($this->guest->can('access', $this->volume));
        $this->assertFalse($this->editor->can('access', $this->volume));
        $this->assertFalse($this->admin->can('access', $this->volume));
        $this->assertTrue($this->globalAdmin->can('access', $this->volume));
    }

    public function testAccessViaProjectMembership()
    {
        $this->volume->visibility_id = Visibility::$private->id;
        $this->assertFalse($this->user->can('access', $this->volume));
        $this->assertTrue($this->guest->can('access', $this->volume));
        $this->assertTrue($this->editor->can('access', $this->volume));
        $this->assertTrue($this->admin->can('access', $this->volume));
        $this->assertTrue($this->globalAdmin->can('access', $this->volume));
    }

    public function testAccessThroughProject()
    {
        $this->assertFalse($this->user->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->guest->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->editor->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->admin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->globalAdmin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertFalse($this->otherAdmin->can('access-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->otherAdmin->can('access-through-project', [$this->volume, $this->otherProject->id]));
    }

    public function testEditThroughProject()
    {
        $this->assertFalse($this->user->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertFalse($this->guest->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->editor->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->admin->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->globalAdmin->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertFalse($this->otherAdmin->can('edit-through-project', [$this->volume, $this->project->id]));
        $this->assertTrue($this->otherAdmin->can('edit-through-project', [$this->volume, $this->otherProject->id]));
    }

    public function testUpdate()
    {
        $this->volume->addMember($this->user, Role::$admin);
        $this->assertTrue($this->user->can('update', $this->volume));
        $this->assertFalse($this->admin->can('update', $this->volume));
        $this->assertTrue($this->globalAdmin->can('update', $this->volume));
    }

    public function testDestroy()
    {
        $this->volume->addMember($this->user, Role::$admin);
        $this->assertTrue($this->user->can('destroy', $this->volume));
        $this->assertFalse($this->admin->can('destroy', $this->volume));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->volume));
    }

    public function testAddMember()
    {
        $this->volume->addMember($this->user, Role::$admin);
        $this->assertTrue($this->user->can('add-member', $this->volume));
        $this->assertFalse($this->admin->can('add-member', $this->volume));
        $this->assertTrue($this->globalAdmin->can('add-member', $this->volume));
    }

    public function testRemoveMember()
    {
        $this->volume->addMember($this->user, Role::$admin);
        $this->assertTrue($this->user->can('remove-member', $this->volume));
        $this->assertFalse($this->admin->can('remove-member', $this->volume));
        $this->assertTrue($this->globalAdmin->can('remove-member', $this->volume));
    }
}
