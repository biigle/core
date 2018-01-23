<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;

class AnnotationLabelPolicyTest extends TestCase
{
    private $annotation;
    private $project;
    private $user;
    private $guest;
    private $editor;
    private $admin;
    private $globalAdmin;

    public function setUp()
    {
        parent::setUp();
        $image = ImageTest::create();
        $this->project = ProjectTest::create();
        $this->project->volumes()->attach($image->volume);
        $this->annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'project_volume_id' => $this->project->volumes()->find($image->volume_id)->pivot->id,
        ]);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);

        $this->otherProject = ProjectTest::create();
        $this->otherProject->volumes()->attach($image->volume);
        $this->otherAdmin = UserTest::create();
        $this->otherProject->addUserId($this->otherAdmin->id, Role::$admin->id);
    }

    public function testUpdate()
    {
        $label = LabelTest::create();
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
            'user_id' => $this->user->id,
        ]);

        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
            'user_id' => $this->guest->id,
        ]);

        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
            'user_id' => $this->editor->id,
        ]);

        $this->assertFalse($this->user->can('update', $al1));
        $this->assertFalse($this->user->can('update', $al2));
        $this->assertFalse($this->user->can('update', $al3));

        $this->assertFalse($this->guest->can('update', $al1));
        $this->assertFalse($this->guest->can('update', $al2));
        $this->assertFalse($this->guest->can('update', $al3));

        $this->assertFalse($this->editor->can('update', $al1));
        $this->assertFalse($this->editor->can('update', $al2));
        $this->assertTrue($this->editor->can('update', $al3));

        $this->assertTrue($this->admin->can('update', $al1));
        $this->assertTrue($this->admin->can('update', $al2));
        $this->assertTrue($this->admin->can('update', $al3));

        $this->assertTrue($this->globalAdmin->can('update', $al1));
        $this->assertTrue($this->globalAdmin->can('update', $al2));
        $this->assertTrue($this->globalAdmin->can('update', $al3));

        $this->assertFalse($this->otherAdmin->can('update', $al1));
        $this->assertFalse($this->otherAdmin->can('update', $al2));
        $this->assertFalse($this->otherAdmin->can('update', $al3));
    }

    public function testDestroy()
    {
        $label = LabelTest::create();
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
            'user_id' => $this->user->id,
        ]);

        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
            'user_id' => $this->guest->id,
        ]);

        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $this->annotation->id,
            'label_id' => $label->id,
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

        $this->assertTrue($this->admin->can('destroy', $al1));
        $this->assertTrue($this->admin->can('destroy', $al2));
        $this->assertTrue($this->admin->can('destroy', $al3));

        $this->assertTrue($this->globalAdmin->can('destroy', $al1));
        $this->assertTrue($this->globalAdmin->can('destroy', $al2));
        $this->assertTrue($this->globalAdmin->can('destroy', $al3));

        $this->assertFalse($this->otherAdmin->can('destroy', $al1));
        $this->assertFalse($this->otherAdmin->can('destroy', $al2));
        $this->assertFalse($this->otherAdmin->can('destroy', $al3));
    }
}
