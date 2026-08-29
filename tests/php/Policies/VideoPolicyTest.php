<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\LabelTest;
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
        $this->project = ProjectTest::create();
        $volume = VolumeTest::create();
        $this->project->addVolumeId($volume->id);
        $this->video = VideoTest::create(['volume_id' => $volume->id]);
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
        $this->assertFalse($this->globalAdmin->can('add-annotation', $this->video));
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

    public function testAttachLabel()
    {
        $allowedLabel = LabelTest::create();
        $this->project->labelTrees()->attach($allowedLabel->label_tree_id);
        $disallowedLabel = LabelTest::create();

        // the annotation belongs to this project, too, and the label is a valid one
        // for the project *but* no user belongs to the project so they shouldn't be able
        // to attach the label
        $otherProject = ProjectTest::create();
        $otherProject->volumes()->attach($this->video->volume);
        $otherDisallowedLabel = LabelTest::create();
        $otherProject->labelTrees()->attach($otherDisallowedLabel->label_tree_id);

        $this->assertFalse($this->user->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->video, $otherDisallowedLabel]));

        $this->assertFalse($this->guest->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->video, $otherDisallowedLabel]));

        $this->assertTrue($this->editor->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->video, $otherDisallowedLabel]));

        $this->assertTrue($this->expert->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->video, $otherDisallowedLabel]));

        $this->assertTrue($this->admin->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->video, $otherDisallowedLabel]));

        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->video, $allowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->video, $disallowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->video, $otherDisallowedLabel]));
    }
}
