<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Cache;
use Carbon\Carbon;
use TestCase;

class VideoAnnotationPolicyTest extends TestCase
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

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->annotation));
        $this->assertTrue($this->guest->can('access', $this->annotation));
        $this->assertTrue($this->editor->can('access', $this->annotation));
        $this->assertTrue($this->expert->can('access', $this->annotation));
        $this->assertTrue($this->admin->can('access', $this->annotation));
        $this->assertTrue($this->globalAdmin->can('access', $this->annotation));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->annotation));
        $this->assertFalse($this->guest->can('update', $this->annotation));
        $this->assertTrue($this->editor->can('update', $this->annotation));
        $this->assertTrue($this->expert->can('update', $this->annotation));
        $this->assertTrue($this->admin->can('update', $this->annotation));
        $this->assertTrue($this->globalAdmin->can('update', $this->annotation));
    }

    public function testAttachLabel()
    {
        $allowedLabel = LabelTest::create();
        $this->project->labelTrees()->attach($allowedLabel->label_tree_id);
        $disallowedLabel = LabelTest::create();

        $this->assertFalse($this->user->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->annotation, $disallowedLabel]));

        $this->assertFalse($this->guest->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->annotation, $disallowedLabel]));

        $this->assertTrue($this->editor->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->annotation, $disallowedLabel]));

        $this->assertTrue($this->expert->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->annotation, $disallowedLabel]));

        $this->assertTrue($this->admin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->annotation, $disallowedLabel]));

        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->annotation, $disallowedLabel]));
    }

    public function testDestroy()
    {
        $video = VideoTest::create(['project_id' => $this->project->id]);

        // has a label of user
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has a label of guest
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has a label of editor
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has labels od editor and admin
        $a4 = VideoAnnotationTest::create(['video_id' => $video->id]);

        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $a1->id,
            'user_id' => $this->user->id,
        ]);
        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $a2->id,
            'user_id' => $this->guest->id,
        ]);
        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $a3->id,
            'user_id' => $this->editor->id,
        ]);
        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $a4->id,
            'user_id' => $this->editor->id,
        ]);
        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $a4->id,
            'user_id' => $this->admin->id,
        ]);

        $this->assertFalse($this->user->can('destroy', $a1));
        $this->assertFalse($this->user->can('destroy', $a2));
        $this->assertFalse($this->user->can('destroy', $a3));
        $this->assertFalse($this->user->can('destroy', $a4));

        $this->assertFalse($this->guest->can('destroy', $a1));
        $this->assertFalse($this->guest->can('destroy', $a2));
        $this->assertFalse($this->guest->can('destroy', $a3));
        $this->assertFalse($this->guest->can('destroy', $a4));

        $this->assertFalse($this->editor->can('destroy', $a1));
        $this->assertFalse($this->editor->can('destroy', $a2));
        $this->assertTrue($this->editor->can('destroy', $a3));
        // There is a label of another user attached.
        $this->assertFalse($this->editor->can('destroy', $a4));

        $this->assertTrue($this->expert->can('destroy', $a1));
        $this->assertTrue($this->expert->can('destroy', $a2));
        $this->assertTrue($this->expert->can('destroy', $a3));
        $this->assertTrue($this->expert->can('destroy', $a4));

        $this->assertTrue($this->admin->can('destroy', $a1));
        $this->assertTrue($this->admin->can('destroy', $a2));
        $this->assertTrue($this->admin->can('destroy', $a3));
        $this->assertTrue($this->admin->can('destroy', $a4));

        $this->assertTrue($this->globalAdmin->can('destroy', $a1));
        $this->assertTrue($this->globalAdmin->can('destroy', $a2));
        $this->assertTrue($this->globalAdmin->can('destroy', $a3));
        $this->assertTrue($this->globalAdmin->can('destroy', $a4));
    }
}
