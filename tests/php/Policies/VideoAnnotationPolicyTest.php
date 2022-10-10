<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\AnnotationSessionTest;
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
        $this->annotation = VideoAnnotationTest::create();
        $this->project = ProjectTest::create();
        $this->project->volumes()->attach($this->annotation->video->volume);
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

    public function testAccessAnnotationSession()
    {
        $this->annotation->created_at = Carbon::yesterday();
        $this->annotation->save();

        $session = AnnotationSessionTest::create([
            'volume_id' => $this->annotation->video->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $this->assertFalse($this->user->can('access', $this->annotation));
        $this->assertTrue($this->guest->can('access', $this->annotation));
        $this->assertTrue($this->editor->can('access', $this->annotation));
        $this->assertTrue($this->expert->can('access', $this->annotation));
        $this->assertTrue($this->admin->can('access', $this->annotation));
        $this->assertTrue($this->globalAdmin->can('access', $this->annotation));

        $session->users()->attach([
            $this->user->id,
            $this->guest->id,
            $this->editor->id,
            $this->expert->id,
            $this->admin->id,
            $this->globalAdmin->id,
        ]);
        Cache::flush();

        $this->assertFalse($this->user->can('access', $this->annotation));
        $this->assertFalse($this->guest->can('access', $this->annotation));
        $this->assertFalse($this->editor->can('access', $this->annotation));
        $this->assertFalse($this->expert->can('access', $this->annotation));
        $this->assertFalse($this->admin->can('access', $this->annotation));
        $this->assertTrue($this->globalAdmin->can('access', $this->annotation));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->annotation));
        $this->assertFalse($this->guest->can('update', $this->annotation));
        $this->assertTrue($this->editor->can('update', $this->annotation));
        $this->assertTrue($this->expert->can('update', $this->annotation));
        $this->assertTrue($this->admin->can('update', $this->annotation));
        $this->assertFalse($this->globalAdmin->can('update', $this->annotation));
    }

    public function testAttachLabel()
    {
        $allowedLabel = LabelTest::create();
        $this->project->labelTrees()->attach($allowedLabel->label_tree_id);
        $disallowedLabel = LabelTest::create();

        // the annotation belongs to this project, too, and the label is a valid one
        // for the project *but* no user belongs to the project so they shouldn't be able
        // to attach the label
        $otherProject = ProjectTest::create();
        $otherProject->volumes()->attach($this->annotation->video->volume);
        $otherDisallowedLabel = LabelTest::create();
        $otherProject->labelTrees()->attach($otherDisallowedLabel->label_tree_id);

        $this->assertFalse($this->user->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertFalse($this->guest->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertTrue($this->editor->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertTrue($this->expert->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertTrue($this->admin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->annotation, $otherDisallowedLabel]));
    }

    public function testDestroy()
    {
        $video = VideoTest::create(['volume_id' => $this->annotation->video->volume_id]);

        // has a label of user
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has a label of guest
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has a label of editor
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id]);
        // has labels od editor and admin
        $a4 = VideoAnnotationTest::create(['video_id' => $video->id]);

        VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->user->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->guest->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $this->editor->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $this->editor->id,
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
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

        $this->assertFalse($this->globalAdmin->can('destroy', $a1));
        $this->assertFalse($this->globalAdmin->can('destroy', $a2));
        $this->assertFalse($this->globalAdmin->can('destroy', $a3));
        $this->assertFalse($this->globalAdmin->can('destroy', $a4));
    }
}
