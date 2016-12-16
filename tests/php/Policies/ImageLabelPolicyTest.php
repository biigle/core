<?php

namespace Dias\Tests\Policies;

use TestCase;
use Dias\Role;
use Dias\Tests\UserTest;
use Dias\Tests\LabelTest;
use Dias\Tests\ImageTest;
use Dias\Tests\ProjectTest;
use Dias\Tests\ImageLabelTest;

class ImageLabelPolicyTest extends TestCase
{
    private $image;
    private $project;
    private $user;
    private $guest;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create();
        $this->project = ProjectTest::create();
        $this->project->transects()->attach($this->image->transect);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);
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

        $this->assertTrue($this->admin->can('destroy', $il1));
        $this->assertTrue($this->admin->can('destroy', $il2));
        $this->assertTrue($this->admin->can('destroy', $il3));

        $this->assertTrue($this->globalAdmin->can('destroy', $il1));
        $this->assertTrue($this->globalAdmin->can('destroy', $il2));
        $this->assertTrue($this->globalAdmin->can('destroy', $il3));
    }
}
