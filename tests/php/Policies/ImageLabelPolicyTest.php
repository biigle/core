<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class ImageLabelPolicyTest extends TestCase
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

    public function testDestroy()
    {
        $il1 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->user->id,
        ]);

        $il2 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->guest->id,
        ]);

        $il3 = ImageLabelTest::create([
            'image_id' => $this->image->id,
            'label_id' => LabelTest::create()->id,
            'user_id' => $this->editor->id,
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

        $this->assertTrue($this->expert->can('destroy', $il1));
        $this->assertTrue($this->expert->can('destroy', $il2));
        $this->assertTrue($this->expert->can('destroy', $il3));

        $this->assertTrue($this->admin->can('destroy', $il1));
        $this->assertTrue($this->admin->can('destroy', $il2));
        $this->assertTrue($this->admin->can('destroy', $il3));

        $this->assertFalse($this->globalAdmin->can('destroy', $il1));
        $this->assertFalse($this->globalAdmin->can('destroy', $il2));
        $this->assertFalse($this->globalAdmin->can('destroy', $il3));
    }
}
