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
}
