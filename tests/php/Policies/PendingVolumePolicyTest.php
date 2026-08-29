<?php

namespace Biigle\Tests\Policies;

use Biigle\PendingVolume;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use TestCase;

class PendingVolumePolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $project = Project::factory()->create();
        $this->user = User::factory()->create();
        $this->guest = User::factory()->create();
        $this->editor = User::factory()->create();
        $this->expert = User::factory()->create();
        $this->admin = User::factory()->create();
        $this->owner = User::factory()->create();
        $this->globalAdmin = User::factory()->create(['role_id' => Role::adminId()]);
        $this->pv = PendingVolume::factory()->create([
            'project_id' => $project->id,
            'user_id' => $this->owner->id,
        ]);

        $project->addUserId($this->guest->id, Role::guestId());
        $project->addUserId($this->editor->id, Role::editorId());
        $project->addUserId($this->expert->id, Role::expertId());
        $project->addUserId($this->admin->id, Role::adminId());
        $project->addUserId($this->owner->id, Role::adminId());
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->pv));
        $this->assertFalse($this->guest->can('access', $this->pv));
        $this->assertFalse($this->editor->can('access', $this->pv));
        $this->assertFalse($this->expert->can('access', $this->pv));
        $this->assertFalse($this->admin->can('access', $this->pv));
        $this->assertTrue($this->owner->can('access', $this->pv));
        $this->assertTrue($this->globalAdmin->can('access', $this->pv));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->pv));
        $this->assertFalse($this->guest->can('update', $this->pv));
        $this->assertFalse($this->editor->can('update', $this->pv));
        $this->assertFalse($this->expert->can('update', $this->pv));
        $this->assertFalse($this->admin->can('update', $this->pv));
        $this->assertTrue($this->owner->can('update', $this->pv));
        $this->assertTrue($this->globalAdmin->can('update', $this->pv));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->pv));
        $this->assertFalse($this->guest->can('destroy', $this->pv));
        $this->assertFalse($this->editor->can('destroy', $this->pv));
        $this->assertFalse($this->expert->can('destroy', $this->pv));
        $this->assertFalse($this->admin->can('destroy', $this->pv));
        $this->assertTrue($this->owner->can('destroy', $this->pv));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->pv));
    }
}
