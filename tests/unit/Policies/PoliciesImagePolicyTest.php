<?php

use Dias\Role;

class PoliciesImagePolicyTest extends TestCase
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

    public function testAccess()
    {
        $this->assertFalse($this->user->can('access', $this->image));
        $this->assertTrue($this->guest->can('access', $this->image));
        $this->assertTrue($this->editor->can('access', $this->image));
        $this->assertTrue($this->admin->can('access', $this->image));
        $this->assertTrue($this->globalAdmin->can('access', $this->image));
    }

    public function testAddAnnotation()
    {
        $this->assertFalse($this->user->can('add-annotation', $this->image));
        $this->assertFalse($this->guest->can('add-annotation', $this->image));
        $this->assertTrue($this->editor->can('add-annotation', $this->image));
        $this->assertTrue($this->admin->can('add-annotation', $this->image));
        $this->assertTrue($this->globalAdmin->can('add-annotation', $this->image));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->image));
        $this->assertFalse($this->guest->can('destroy', $this->image));
        $this->assertFalse($this->editor->can('destroy', $this->image));
        $this->assertTrue($this->admin->can('destroy', $this->image));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->image));
    }
}
