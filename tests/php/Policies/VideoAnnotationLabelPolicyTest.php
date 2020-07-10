<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoAnnotationLabelTest;

class VideoAnnotationLabelPolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->project = ProjectTest::create();
        $this->annotation = VideoAnnotationTest::create([
            'video_id' => VideoTest::create(['project_id' => $this->project->id])->id,
        ]);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->expert = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
        $this->project->addUserId($this->guest->id, Role::guestId());
        $this->project->addUserId($this->editor->id, Role::editorId());
        $this->project->addUserId($this->expert->id, Role::expertId());
        $this->project->addUserId($this->admin->id, Role::adminId());
    }

    public function testDestroy()
    {
        $al1 = VideoAnnotationLabelTest::create([
            'video_annotation_id' => $this->annotation->id,
            'user_id' => $this->user->id,
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'video_annotation_id' => $this->annotation->id,
            'user_id' => $this->guest->id,
        ]);

        $al3 = VideoAnnotationLabelTest::create([
            'video_annotation_id' => $this->annotation->id,
            'user_id' => $this->editor->id,
        ]);

        $this->assertFalse($this->user->can('destroy', $al1));
        $this->assertFalse($this->user->can('destroy', $al2));
        $this->assertFalse($this->user->can('destroy', $al3));

        $this->assertFalse($this->guest->can('destroy', $al1));
        $this->assertFalse($this->guest->can('destroy', $al2));
        $this->assertFalse($this->guest->can('destroy', $al3));

        $this->assertFalse($this->editor->can('destroy', $al1));
        $this->assertFalse($this->editor->can('destroy', $al2));
        $this->assertTrue($this->editor->can('destroy', $al3));

        $this->assertTrue($this->expert->can('destroy', $al1));
        $this->assertTrue($this->expert->can('destroy', $al2));
        $this->assertTrue($this->expert->can('destroy', $al3));

        $this->assertTrue($this->admin->can('destroy', $al1));
        $this->assertTrue($this->admin->can('destroy', $al2));
        $this->assertTrue($this->admin->can('destroy', $al3));

        $this->assertTrue($this->globalAdmin->can('destroy', $al1));
        $this->assertTrue($this->globalAdmin->can('destroy', $al2));
        $this->assertTrue($this->globalAdmin->can('destroy', $al3));
    }
}
