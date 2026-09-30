<?php

namespace Biigle\Tests\Services;

use Biigle\AnnotationGuideline;
use Biigle\Role;
use Biigle\Services\AnnotationGuidelineService;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class AnnotationGuidelineServiceTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->volume = VolumeTest::create();
        $this->user = UserTest::create();

        $this->editorProject = ProjectTest::create();
        $this->editorProject->addVolumeId($this->volume->id);
        $this->editorProject->addUserId($this->user->id, Role::editorId());

        $this->expertProject = ProjectTest::create();
        $this->expertProject->addVolumeId($this->volume->id);
        $this->expertProject->addUserId($this->user->id, Role::expertId());

        $this->guestProject = ProjectTest::create();
        $this->guestProject->addVolumeId($this->volume->id);
        $this->guestProject->addUserId($this->user->id, Role::guestId());

        // The user is no member of this project.
        $this->otherProject = ProjectTest::create();
        $this->otherProject->addVolumeId($this->volume->id);

        $this->service = new AnnotationGuidelineService;
    }

    public function testGetGuidelines()
    {
        $g1 = $this->createGuideline($this->editorProject, true);
        $g2 = $this->createGuideline($this->expertProject, false);
        $g3 = $this->createGuideline($this->guestProject, true);
        $this->createGuideline($this->otherProject, true);

        $ids = $this->service->getGuidelines($this->user, $this->volume->id)
            ->pluck('id')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([$g1->id, $g2->id, $g3->id], $ids);
    }

    public function testGetGuidelinesEditable()
    {
        $g1 = $this->createGuideline($this->editorProject, true);
        $g2 = $this->createGuideline($this->expertProject, false);
        $this->createGuideline($this->guestProject, true);
        $this->createGuideline($this->otherProject, true);

        $ids = $this->service->getGuidelines($this->user, $this->volume->id, true)
            ->pluck('id')
            ->sort()
            ->values()
            ->all();

        $this->assertSame([$g1->id, $g2->id], $ids);
    }

    public function testGetGuidelinesMemoized()
    {
        $this->createGuideline($this->editorProject, true);
        $this->service->getGuidelines($this->user, $this->volume->id);
        $this->service->getGuidelines($this->user, $this->volume->id, true);
        $this->createGuideline($this->guestProject, true);

        $this->assertCount(1, $this->service->getGuidelines($this->user, $this->volume->id));
        $this->assertCount(1, $this->service->getGuidelines($this->user, $this->volume->id, true));
    }

    public function testGetGuidelinesMemoizedPerArguments()
    {
        $this->createGuideline($this->editorProject, true);
        $this->createGuideline($this->guestProject, true);

        $this->assertCount(2, $this->service->getGuidelines($this->user, $this->volume->id));
        $this->assertCount(1, $this->service->getGuidelines($this->user, $this->volume->id, true));
    }

    public function testMustUseGuidelineNoGuidelines()
    {
        $this->assertFalse($this->service->mustUseGuideline($this->user, $this->volume->id));
    }

    public function testMustUseGuidelineProjectWithoutGuideline()
    {
        $this->createGuideline($this->editorProject, true);
        // The expert project has no guideline.

        $this->assertFalse($this->service->mustUseGuideline($this->user, $this->volume->id));
    }

    public function testMustUseGuidelineInformational()
    {
        $this->createGuideline($this->editorProject, true);
        $this->createGuideline($this->expertProject, false);

        $this->assertFalse($this->service->mustUseGuideline($this->user, $this->volume->id));
    }

    public function testMustUseGuidelineAllEnforced()
    {
        $this->createGuideline($this->editorProject, true);
        $this->createGuideline($this->expertProject, true);

        // The guest project without guideline must not count.
        $this->assertTrue($this->service->mustUseGuideline($this->user, $this->volume->id));
    }

    public function testMustUseGuidelineGlobalAdmin()
    {
        $admin = UserTest::create(['role_id' => Role::adminId()]);
        $this->editorProject->addUserId($admin->id, Role::editorId());
        $this->createGuideline($this->editorProject, true);

        // The other projects without guideline must not count because the global admin
        // is no member there.
        $this->assertTrue($this->service->mustUseGuideline($admin, $this->volume->id));
    }

    protected function createGuideline($project, bool $enforced): AnnotationGuideline
    {
        return AnnotationGuideline::factory()->create([
            'project_id' => $project->id,
            'enforced' => $enforced,
        ]);
    }
}
