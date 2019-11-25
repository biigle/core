<?php

namespace Biigle\Tests\Modules\Videos\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\Modules\Videos\VideoTest;

class VideoPolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $project = ProjectTest::create();
        $this->video = VideoTest::create(['project_id' => $project->id]);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->expert = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);

        $project->addUserId($this->guest->id, Role::guestId());
        $project->addUserId($this->editor->id, Role::editorId());
        $project->addUserId($this->expert->id, Role::expertId());
        $project->addUserId($this->admin->id, Role::adminId());
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->video));
        $this->assertTrue($this->guest->can('access', $this->video));
        $this->assertTrue($this->editor->can('access', $this->video));
        $this->assertTrue($this->expert->can('access', $this->video));
        $this->assertTrue($this->admin->can('access', $this->video));
        $this->assertTrue($this->globalAdmin->can('access', $this->video));
    }

    public function testEditIn()
    {
        $this->assertFalse($this->user->can('edit-in', $this->video));
        $this->assertFalse($this->guest->can('edit-in', $this->video));
        $this->assertTrue($this->editor->can('edit-in', $this->video));
        $this->assertTrue($this->expert->can('edit-in', $this->video));
        $this->assertTrue($this->admin->can('edit-in', $this->video));
        $this->assertTrue($this->globalAdmin->can('edit-in', $this->video));
    }

    public function testForceEditIn()
    {
        $this->assertFalse($this->user->can('force-edit-in', $this->video));
        $this->assertFalse($this->guest->can('force-edit-in', $this->video));
        $this->assertFalse($this->editor->can('force-edit-in', $this->video));
        $this->assertTrue($this->expert->can('force-edit-in', $this->video));
        $this->assertTrue($this->admin->can('force-edit-in', $this->video));
        $this->assertTrue($this->globalAdmin->can('force-edit-in', $this->video));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->video));
        $this->assertFalse($this->guest->can('update', $this->video));
        $this->assertFalse($this->editor->can('update', $this->video));
        $this->assertFalse($this->expert->can('update', $this->video));
        $this->assertTrue($this->admin->can('update', $this->video));
        $this->assertTrue($this->globalAdmin->can('update', $this->video));
    }
}
