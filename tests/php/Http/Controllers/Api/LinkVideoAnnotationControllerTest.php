<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

class LinkVideoAnnotationControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create(['volume_id' => $id]);
    }

    public function testStoreValidation()
    {
        [$a1, $a2] = $this->createAnnotations(Shape::pointId());

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$a1->id}/link");

        $this->beUser();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => 0,
            ])
            // Second annotation ID must exist.
            ->assertStatus(404);

        $a2->update(['video_id' => VideoTest::create()->id]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // Other annotation must belong to the same video.
            ->assertStatus(422);

        $a2->update(['video_id' => $this->video->id, 'shape_id' => Shape::circleId()]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // The shapes must match.
            ->assertStatus(422);

        $a2->update(['shape_id' => Shape::pointId()]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $a1->id]);

        $this->assertSame(1, $this->video->annotations()->count());
        $this->assertNull($a2->fresh());
    }

    public function testStoreValidateOverlap()
    {
        [$a1, $a2] = $this->createAnnotations(Shape::pointId());
        $a2->update(['frames' => [1.5, 2.5]]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 1.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.25, 1.75]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 2.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 2.0]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.0, 2.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.0, 2.0]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);
    }

    public function testStoreBefore()
    {
        // The annotation that is linked starts after the other annotation.
        [$a2, $a1] = $this->createAnnotations(Shape::pointId());

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, null, 3, 4], $a1->frames);
        $this->assertSame([[10, 10], [20, 20], [], [30, 30], [40, 40]], $a1->points);
    }

    public function testStoreAfter()
    {
        [$a1, $a2] = $this->createAnnotations(Shape::pointId());

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, null, 3, 4], $a1->frames);
        $this->assertSame([[10, 10], [20, 20], [], [30, 30], [40, 40]], $a1->points);
    }

    public function testStoreMergeLabels()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 10]],
        ]);

        $l1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [2.0],
            'points' => [[20, 20]],
        ]);

        $l2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
        ]);

        $l3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $l1->user_id,
        ]);

        $l4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $l1->user_id,
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $this->assertSame(3, $a1->labels()->count());
        $this->assertNotNull($l1->fresh());
        $this->assertSame($a1->id, $l2->fresh()->annotation_id);
        $this->assertSame($a1->id, $l3->fresh()->annotation_id);
        $this->assertNull($l4->fresh());
    }

    public function testStoreTouching()
    {
        [$a1, $a2] = $this->createAnnotations(Shape::pointId());
        $a2->update(['frames' => [2.09, 3.0]]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, 3], $a1->frames);
        $this->assertSame([[10, 10], [20, 20], [40, 40]], $a1->points);
    }

    public function testStoreSingleFrameTouching()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 10]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[30, 30]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // This is the same than overlapping times of an annotation clip.
            ->assertStatus(422);
    }

    public function testStoreWholeFrame()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [2.0],
            'points' => [],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, null, 2], $a1->frames);
        $this->assertEmpty($a1->points);
    }

    public function testStoreGuidelineRequired()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelRoot()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(200);
    }

    public function testStoreGuidelineOptional()
    {
        $this->createGuideline(['enforced' => true]);
        // The editor can annotate in this project, too, and it has no guideline.
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);
        $project->addUserId($this->editor()->id, Role::editorId());
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelRoot()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);
    }

    public function testStoreGuidelineNotExists()
    {
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelRoot()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => -1,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');
    }

    public function testStoreGuidelineNotEnforced()
    {
        $guideline = $this->createGuideline(['enforced' => false]);
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelRoot()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);
    }

    public function testStoreGuidelineLabel()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        // The label of the second annotation is not allowed.
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelChild()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('annotation_id');

        $this->assertNotNull($a2->fresh());
    }

    public function testStoreGuidelineOnlyShapes()
    {
        $guideline = $this->createGuideline([
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelRoot()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('annotation_id');

        $this->assertNotNull($a2->fresh());
    }

    public function testStoreGuidelineLabelShape()
    {
        $guideline = $this->createGuideline(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelChild()->id,
            'shape_id' => Shape::circleId(),
        ]);
        // The label of the second annotation requires another shape.
        [$a1, $a2] = $this->createAnnotations(Shape::pointId(), $this->labelRoot()->id, $this->labelChild()->id);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
                'guideline_id' => $guideline->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('annotation_id');

        $this->assertNotNull($a2->fresh());
    }

    protected function createGuideline(array $attrs = []): AnnotationGuideline
    {
        return AnnotationGuideline::factory()->create(array_merge([
            'project_id' => $this->project()->id,
        ], $attrs));
    }

    /**
     * Create two annotations that can be linked (optionally with one label each).
     */
    protected function createAnnotations(int $shapeId, ?int $label1Id = null, ?int $label2Id = null): array
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => $shapeId,
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => $shapeId,
            'video_id' => $this->video->id,
            'frames' => [3.0, 4.0],
            'points' => [[30, 30], [40, 40]],
        ]);

        if (!is_null($label1Id)) {
            VideoAnnotationLabelTest::create([
                'annotation_id' => $a1->id,
                'label_id' => $label1Id,
                'user_id' => $this->editor()->id,
            ]);
        }

        if (!is_null($label2Id)) {
            VideoAnnotationLabelTest::create([
                'annotation_id' => $a2->id,
                'label_id' => $label2Id,
                'user_id' => $this->editor()->id,
            ]);
        }

        return [$a1, $a2];
    }
}
