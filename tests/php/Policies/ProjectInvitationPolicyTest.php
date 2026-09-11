<?php

namespace Biigle\Tests\Policies;

use Biigle\ProjectInvitation;
use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class ProjectInvitationPolicyTest extends TestCase
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
        $this->globalAdmin = UserTest::create(['role_id' => Role::ADMIN->value]);

        $this->project->addUserId($this->guest->id, Role::GUEST->value);
        $this->project->addUserId($this->editor->id, Role::EDITOR->value);
        $this->project->addUserId($this->expert->id, Role::EXPERT->value);
        $this->project->addUserId($this->admin->id, Role::ADMIN->value);
    }

    public function testAccess()
    {
        $invitation = ProjectInvitation::factory()->create([
            'project_id' => $this->project->id,
        ]);

        $this->assertFalse($this->user->can('access', $invitation));
        $this->assertFalse($this->guest->can('access', $invitation));
        $this->assertFalse($this->editor->can('access', $invitation));
        $this->assertFalse($this->expert->can('access', $invitation));
        $this->assertTrue($this->admin->can('access', $invitation));
        $this->assertTrue($this->globalAdmin->can('access', $invitation));
    }

    public function testDestroy()
    {
        $invitation = ProjectInvitation::factory()->create([
            'project_id' => $this->project->id,
        ]);

        $this->assertFalse($this->user->can('destroy', $invitation));
        $this->assertFalse($this->guest->can('destroy', $invitation));
        $this->assertFalse($this->editor->can('destroy', $invitation));
        $this->assertFalse($this->expert->can('destroy', $invitation));
        $this->assertTrue($this->admin->can('destroy', $invitation));
        $this->assertTrue($this->globalAdmin->can('destroy', $invitation));
    }
}
