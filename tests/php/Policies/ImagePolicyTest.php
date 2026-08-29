<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class ImagePolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->image = ImageTest::create();
        $this->project = ProjectTest::create();
        $this->project->volumes()->attach($this->image->volume);
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
        $this->assertFalse($this->user->can('access', $this->image));
        $this->assertTrue($this->guest->can('access', $this->image));
        $this->assertTrue($this->editor->can('access', $this->image));
        $this->assertTrue($this->expert->can('access', $this->image));
        $this->assertTrue($this->admin->can('access', $this->image));
        $this->assertTrue($this->globalAdmin->can('access', $this->image));
    }

    public function testAddAnnotation()
    {
        $this->assertFalse($this->user->can('add-annotation', $this->image));
        $this->assertFalse($this->guest->can('add-annotation', $this->image));
        $this->assertTrue($this->editor->can('add-annotation', $this->image));
        $this->assertTrue($this->expert->can('add-annotation', $this->image));
        $this->assertTrue($this->admin->can('add-annotation', $this->image));
        $this->assertFalse($this->globalAdmin->can('add-annotation', $this->image));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->image));
        $this->assertFalse($this->guest->can('destroy', $this->image));
        $this->assertFalse($this->editor->can('destroy', $this->image));
        $this->assertFalse($this->expert->can('destroy', $this->image));
        $this->assertTrue($this->admin->can('destroy', $this->image));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->image));
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
        $otherProject->volumes()->attach($this->image->volume);
        $otherDisallowedLabel = LabelTest::create();
        $otherProject->labelTrees()->attach($otherDisallowedLabel->label_tree_id);

        $this->assertFalse($this->user->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->user->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertFalse($this->guest->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->guest->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertTrue($this->editor->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->editor->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertTrue($this->expert->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->expert->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertTrue($this->admin->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->globalAdmin->can('attach-label', [$this->image, $otherDisallowedLabel]));
    }
}
