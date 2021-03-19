<?php

namespace Biigle\Tests\Policies;

use Biigle\Project;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class ProjectPolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->project = ProjectTest::create();
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->expert = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalGuest = UserTest::create(['role_id' => Role::guestId()]);
        $this->globalEditor = UserTest::create(['role_id' => Role::editorId()]);
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);

        $this->project->addUserId($this->guest->id, Role::guestId());
        $this->project->addUserId($this->editor->id, Role::editorId());
        $this->project->addUserId($this->expert->id, Role::expertId());
        $this->project->addUserId($this->admin->id, Role::adminId());
    }

    public function testCreate()
    {
        $this->assertFalse($this->globalGuest->can('create', Project::class));
        $this->assertTrue($this->globalEditor->can('create', Project::class));
        $this->assertTrue($this->globalAdmin->can('create', Project::class));
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->project));
        $this->assertTrue($this->guest->can('access', $this->project));
        $this->assertTrue($this->editor->can('access', $this->project));
        $this->assertTrue($this->expert->can('access', $this->project));
        $this->assertTrue($this->admin->can('access', $this->project));
        $this->assertTrue($this->globalAdmin->can('access', $this->project));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->project));
        $this->assertFalse($this->guest->can('edit-in', $this->project));
        $this->assertTrue($this->editor->can('edit-in', $this->project));
        $this->assertTrue($this->expert->can('edit-in', $this->project));
        $this->assertTrue($this->admin->can('edit-in', $this->project));
        $this->assertFalse($this->globalAdmin->can('edit-in', $this->project));
    }

    public function testForceEditIn()
    {
        $this->assertFalse($this->user->can('force-edit-in', $this->project));
        $this->assertFalse($this->guest->can('force-edit-in', $this->project));
        $this->assertFalse($this->editor->can('force-edit-in', $this->project));
        $this->assertTrue($this->expert->can('force-edit-in', $this->project));
        $this->assertTrue($this->admin->can('force-edit-in', $this->project));
        $this->assertFalse($this->globalAdmin->can('force-edit-in', $this->project));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->project));
        $this->assertFalse($this->guest->can('update', $this->project));
        $this->assertFalse($this->editor->can('update', $this->project));
        $this->assertFalse($this->expert->can('update', $this->project));
        $this->assertTrue($this->admin->can('update', $this->project));
        $this->assertTrue($this->globalAdmin->can('update', $this->project));
    }

    public function testRemoveMember()
    {
        $this->assertFalse($this->user->can('remove-member', [$this->project, $this->user]));
        $this->assertFalse($this->user->can('remove-member', [$this->project, $this->guest]));
        $this->assertFalse($this->user->can('remove-member', [$this->project, $this->editor]));
        $this->assertFalse($this->user->can('remove-member', [$this->project, $this->admin]));

        $this->assertFalse($this->guest->can('remove-member', [$this->project, $this->user]));
        $this->assertTrue($this->guest->can('remove-member', [$this->project, $this->guest]));
        $this->assertFalse($this->guest->can('remove-member', [$this->project, $this->editor]));
        $this->assertFalse($this->guest->can('remove-member', [$this->project, $this->admin]));

        $this->assertFalse($this->editor->can('remove-member', [$this->project, $this->user]));
        $this->assertFalse($this->editor->can('remove-member', [$this->project, $this->guest]));
        $this->assertTrue($this->editor->can('remove-member', [$this->project, $this->editor]));
        $this->assertFalse($this->editor->can('remove-member', [$this->project, $this->admin]));

        $this->assertFalse($this->expert->can('remove-member', [$this->project, $this->user]));
        $this->assertFalse($this->expert->can('remove-member', [$this->project, $this->guest]));
        $this->assertTrue($this->expert->can('remove-member', [$this->project, $this->expert]));
        $this->assertFalse($this->expert->can('remove-member', [$this->project, $this->admin]));

        $this->assertFalse($this->admin->can('remove-member', [$this->project, $this->user]));
        $this->assertTrue($this->admin->can('remove-member', [$this->project, $this->guest]));
        $this->assertTrue($this->admin->can('remove-member', [$this->project, $this->editor]));
        $this->assertTrue($this->admin->can('remove-member', [$this->project, $this->admin]));

        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->project, $this->user]));
        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->project, $this->guest]));
        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->project, $this->editor]));
        $this->assertTrue($this->globalAdmin->can('remove-member', [$this->project, $this->admin]));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->project));
        $this->assertFalse($this->guest->can('destroy', $this->project));
        $this->assertFalse($this->editor->can('destroy', $this->project));
        $this->assertFalse($this->expert->can('destroy', $this->project));
        $this->assertTrue($this->admin->can('destroy', $this->project));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->project));
    }
}
