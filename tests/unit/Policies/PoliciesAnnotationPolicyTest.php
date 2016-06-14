<?php

use Dias\Role;

class PoliciesAnnotationPolicyTest extends TestCase
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
        $this->annotation = AnnotationTest::create();
        $this->project = ProjectTest::create();
        $this->project->transects()->attach($this->annotation->image->transect);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);

        $this->project->addUserId($this->guest->id, Role::$guest->id);
        $this->project->addUserId($this->editor->id, Role::$editor->id);
        $this->project->addUserId($this->admin->id, Role::$admin->id);
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
        $otherProject->transects()->attach($this->annotation->image->transect);
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

        $this->assertTrue($this->admin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertFalse($this->admin->can('attach-label', [$this->annotation, $otherDisallowedLabel]));

        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->annotation, $allowedLabel]));
        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->annotation, $disallowedLabel]));
        $this->assertTrue($this->globalAdmin->can('attach-label', [$this->annotation, $otherDisallowedLabel]));
    }

    public function testDestroy()
    {
        $transect = TransectTest::create();
        $this->project->transects()->attach($transect);
        $image = ImageTest::create(['transect_id' => $transect->id]);

        // has a label of user
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        // has a label of guest
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        // has a label of editor
        $a3 = AnnotationTest::create(['image_id' => $image->id]);
        // has labels od editor and admin
        $a4 = AnnotationTest::create(['image_id' => $image->id]);

        AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->user->id,
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->guest->id,
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $this->editor->id,
        ]);
        AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $this->editor->id,
        ]);
        AnnotationLabelTest::create([
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
        // there is a label of another user attached
        $this->assertFalse($this->editor->can('destroy', $a4));

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
