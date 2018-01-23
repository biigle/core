<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\ProjectVolumeTest;

class ImagePolicyTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->projectVolume = ProjectVolumeTest::create();
        $this->image = ImageTest::create([
            'volume_id' => $this->projectVolume->volume_id
        ]);
        $this->project = $this->projectVolume->project;
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);
    }

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->image));
        $this->assertTrue($this->guest->can('access', $this->image));
        $this->assertTrue($this->editor->can('access', $this->image));
        $this->assertTrue($this->admin->can('access', $this->image));
        $this->assertTrue($this->globalAdmin->can('access', $this->image));

        $this->markTestIncomplete('Distinguish between project access and volume access?');
    }

    public function testAddAnnotation()
    {
        $this->assertFalse($this->user->can('add-annotation', [$this->image, $this->projectVolume]));
        $this->assertFalse($this->guest->can('add-annotation', [$this->image, $this->projectVolume]));
        $this->assertTrue($this->editor->can('add-annotation', [$this->image, $this->projectVolume]));
        $this->assertTrue($this->admin->can('add-annotation', [$this->image, $this->projectVolume]));
        $this->assertTrue($this->globalAdmin->can('add-annotation', [$this->image, $this->projectVolume]));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->image));
        $this->assertFalse($this->guest->can('destroy', $this->image));
        $this->assertFalse($this->editor->can('destroy', $this->image));
        $this->assertTrue($this->admin->can('destroy', $this->image));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->image));

        $this->markTestIncomplete('Require volume membership');
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

        $this->assertTrue($this->admin->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->image, $allowedLabel]));
        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->image, $disallowedLabel]));
        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->image, $otherDisallowedLabel]));

        $this->markTestIncomplete('Check new project_volume_id similar to the annotation policy.');
    }
}
