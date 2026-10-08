<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Events\AnnotationLabelAttached;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\VideoAnnotation;
use Illuminate\Support\Facades\Event;

class VideoAnnotationLabelControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create(['volume_id' => $id]);
    }

    public function testStore()
    {
        Event::fake();
        $annotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $id = $annotation->id;

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$id}/labels");

        $this->beUser();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => LabelTest::create()->id,
            ])
            // Label ID belong to the projects of the video.
            ->assertStatus(403);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => -1,
            ])
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels")
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertSuccessful()
            ->assertJsonFragment(['label_id' => $this->labelRoot()->id]);

        $label = $annotation->labels()->first();
        $this->assertNotNull($label);
        $this->assertSame($this->labelRoot()->id, $label->label_id);
        $this->assertSame($this->editor()->id, $label->user_id);
        Event::assertDispatched(AnnotationLabelAttached::class);

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            // Label is already attached.
            ->assertStatus(422);
    }

    public function testStoreGuidelineRequired()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        $id = $this->createAnnotation(Shape::pointId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineOptional()
    {
        $this->createGuideline(['enforced' => true]);
        // The editor can annotate in this project, too, and it has no guideline.
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);
        $project->addUserId($this->editor()->id, Role::editorId());
        $id = $this->createAnnotation(Shape::pointId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineNotExists()
    {
        $id = $this->createAnnotation(Shape::pointId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => -1,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');
    }

    public function testStoreGuidelineNotEnforced()
    {
        $guideline = $this->createGuideline(['enforced' => false]);
        $id = $this->createAnnotation(Shape::pointId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineLabel()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        $id = $this->createAnnotation(Shape::pointId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelChild()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('label_id');

        $this
            ->postJson("api/v1/video-annotations/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineOnlyShapes()
    {
        $guideline = $this->createGuideline([
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);
        $pointId = $this->createAnnotation(Shape::pointId())->id;
        $circleId = $this->createAnnotation(Shape::circleId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$pointId}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('label_id');

        $this
            ->postJson("api/v1/video-annotations/{$circleId}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineLabelShape()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
            'shape_id' => Shape::circleId(),
        ]);
        $pointId = $this->createAnnotation(Shape::pointId())->id;
        $circleId = $this->createAnnotation(Shape::circleId())->id;

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$pointId}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('label_id');

        $this
            ->postJson("api/v1/video-annotations/{$circleId}/labels", [
                'label_id' => $this->labelRoot()->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertSuccessful();
    }

    public function testDestroy()
    {
        $annotation = VideoAnnotationTest::create(['video_id' => $this->video->id]);
        $annotationLabel1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->expert()->id,
        ]);
        $annotationLabel2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $annotationLabel3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('DELETE', "api/v1/video-annotation-labels/{$annotationLabel1->id}");

        $this->beUser();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            // Cannot detach label of other user.
            ->assertStatus(403);

        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel3->id}")
            ->assertStatus(200);
        $this->assertNull($annotationLabel3->fresh());

        $this->beExpert();
        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel2->id}")
            ->assertStatus(200);
        $this->assertNull($annotationLabel2->fresh());

        $this
            ->deleteJson("api/v1/video-annotation-labels/{$annotationLabel1->id}")
            // Cannot detach the last label.
            ->assertStatus(422);
    }

    protected function createGuideline(array $attrs = []): AnnotationGuideline
    {
        return AnnotationGuideline::factory()->create(array_merge([
            'project_id' => $this->project()->id,
        ], $attrs));
    }

    protected function createAnnotation(int $shapeId): VideoAnnotation
    {
        return VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'shape_id' => $shapeId,
            'points' => $shapeId === Shape::circleId() ? [[10, 11, 5]] : [[10, 11]],
            'frames' => [0.0],
        ]);
    }
}
