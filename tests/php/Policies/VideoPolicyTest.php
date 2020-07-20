<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class VideoPolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->addVolumeId($volume->id);
        $this->video = VideoTest::create(['volume_id' => $volume->id]);
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

    public function testAddAnnotation()
    {
        $this->assertFalse($this->user->can('add-annotation', $this->video));
        $this->assertFalse($this->guest->can('add-annotation', $this->video));
        $this->assertTrue($this->editor->can('add-annotation', $this->video));
        $this->assertTrue($this->expert->can('add-annotation', $this->video));
        $this->assertTrue($this->admin->can('add-annotation', $this->video));
        $this->assertTrue($this->globalAdmin->can('add-annotation', $this->video));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->video));
        $this->assertFalse($this->guest->can('destroy', $this->video));
        $this->assertFalse($this->editor->can('destroy', $this->video));
        $this->assertFalse($this->expert->can('destroy', $this->video));
        $this->assertTrue($this->admin->can('destroy', $this->video));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->video));
    }
}
