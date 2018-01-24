<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ProjectVolumeTest;

class ImageLabelPolicyTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->projectVolume = ProjectVolumeTest::create();
        $this->image = ImageTest::create(['volume_id' => $this->projectVolume->volume_id]);
        $this->project = $this->projectVolume->project;
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);

        $this->otherAdmin = UserTest::create();
        $project = ProjectTest::create();
        $project->volumes()->attach($this->image->volume);
        $project->addUserId($this->otherAdmin->id, Role::$admin->id);
    }

    public function testDestroy()
    {
        $il1 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->user->id,
            'project_volume_id' => $this->projectVolume->id,
        ]);

        $il2 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->guest->id,
            'project_volume_id' => $this->projectVolume->id,
        ]);

        $il3 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->editor->id,
            'project_volume_id' => $this->projectVolume->id,
        ]);

        $this->assertFalse($this->user->can('destroy', $il1));
        $this->assertFalse($this->user->can('destroy', $il2));
        $this->assertFalse($this->user->can('destroy', $il3));

        $this->assertFalse($this->guest->can('destroy', $il1));
        $this->assertFalse($this->guest->can('destroy', $il2));
        $this->assertFalse($this->guest->can('destroy', $il3));

        $this->assertFalse($this->editor->can('destroy', $il1));
        $this->assertFalse($this->editor->can('destroy', $il2));
        $this->assertTrue($this->editor->can('destroy', $il3));

        $this->assertTrue($this->admin->can('destroy', $il1));
        $this->assertTrue($this->admin->can('destroy', $il2));
        $this->assertTrue($this->admin->can('destroy', $il3));

        $this->assertTrue($this->globalAdmin->can('destroy', $il1));
        $this->assertTrue($this->globalAdmin->can('destroy', $il2));
        $this->assertTrue($this->globalAdmin->can('destroy', $il3));

        $this->assertFalse($this->otherAdmin->can('destroy', $il1));
        $this->assertFalse($this->otherAdmin->can('destroy', $il2));
        $this->assertFalse($this->otherAdmin->can('destroy', $il3));
    }
}
