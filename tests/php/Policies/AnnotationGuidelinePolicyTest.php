<?php

namespace Biigle\Tests\Policies;

use Biigle\Enums\Role;
use Biigle\Tests\AnnotationGuidelineTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use TestCase;

class AnnotationGuidelinePolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->project = ProjectTest::create();
        $this->guideline = AnnotationGuidelineTest::create(['project_id' => $this->project->id]);
        $this->user = UserTest::create();
        $this->guest = UserTest::create();
        $this->editor = UserTest::create();
        $this->expert = UserTest::create();
        $this->admin = UserTest::create();
        $this->globalAdmin = UserTest::create(['role' => Role::ADMIN]);

        $this->project->addUserId($this->guest->id, Role::GUEST);
        $this->project->addUserId($this->editor->id, Role::EDITOR);
        $this->project->addUserId($this->expert->id, Role::EXPERT);
        $this->project->addUserId($this->admin->id, Role::ADMIN);
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->guideline));
        $this->assertFalse($this->guest->can('update', $this->guideline));
        $this->assertFalse($this->editor->can('update', $this->guideline));
        $this->assertFalse($this->expert->can('update', $this->guideline));
        $this->assertTrue($this->admin->can('update', $this->guideline));
        $this->assertTrue($this->globalAdmin->can('update', $this->guideline));
    }
}
