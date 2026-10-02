<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Role;
use Biigle\Tests\ProjectTest;

class AnnotationGuidelineControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotation-guidelines");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")->assertStatus(403);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")
            ->assertStatus(200)
            ->assertJsonPath('must_use_guideline', true)
            ->assertJsonCount(1, 'guidelines')
            ->assertJsonPath('guidelines.0.id', $guideline->id)
            ->assertJsonPath('guidelines.0.enforced', true)
            ->assertJsonPath('guidelines.0.can_annotate', true)
            ->assertJsonPath('guidelines.0.labels.0.id', $this->labelRoot()->id)
            ->assertJsonPath('guidelines.0.labels.0.pivot.uuid', $guidelineLabel->uuid);
    }

    public function testIndexGuest()
    {
        $id = $this->volume()->id;
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")
            ->assertStatus(200)
            ->assertJsonCount(1, 'guidelines')
            ->assertJsonPath('guidelines.0.id', $guideline->id)
            ->assertJsonPath('guidelines.0.can_annotate', false);
    }

    public function testIndexInformational()
    {
        $id = $this->volume()->id;
        AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => false,
        ]);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")
            ->assertStatus(200)
            ->assertJsonPath('must_use_guideline', false)
            ->assertJsonCount(1, 'guidelines')
            ->assertJsonPath('guidelines.0.enforced', false)
            ->assertJsonPath('guidelines.0.can_annotate', true);
    }

    public function testIndexMultipleProjects()
    {
        $id = $this->volume()->id;
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);

        // The editor can also annotate in this project, which has no guideline.
        $project = ProjectTest::create();
        $project->addVolumeId($id);
        $project->addUserId($this->editor()->id, Role::editorId());

        // The editor is no member of this project.
        $otherProject = ProjectTest::create();
        $otherProject->addVolumeId($id);
        AnnotationGuideline::factory()->create([
            'project_id' => $otherProject->id,
            'enforced' => true,
        ]);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")
            ->assertStatus(200)
            ->assertJsonPath('must_use_guideline', false)
            ->assertJsonCount(1, 'guidelines')
            ->assertJsonPath('guidelines.0.id', $guideline->id)
            ->assertJsonPath('guidelines.0.can_annotate', true);
    }

    public function testIndexNoGuidelines()
    {
        $id = $this->volume()->id;

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotation-guidelines")
            ->assertStatus(200)
            ->assertExactJson([
                'must_use_guideline' => false,
                'guidelines' => [],
            ]);
    }
}
