<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Label;
use Biigle\Shape;
use Illuminate\Http\UploadedFile;
use Storage;

class AnnotationGuidelineLabelControllerTest extends ApiTestCase
{
    public function testStoreRequiresAdmin()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->doTestApiRoute('POST', $path);

        $this->beEditor();
        $this->json('POST', $path, ['label_id' => $label->id])->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', $path, ['label_id' => $label->id])->assertStatus(201);
    }

    public function testStore()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'shape_id' => Shape::polygonId(),
            'description' => 'some description',
        ])->assertStatus(201);

        $guidelineLabel = $guideline->labels()->where('label_id', $label->id)->first();
        $this->assertNotNull($guidelineLabel);
        $this->assertSame(Shape::polygonId(), $guidelineLabel->pivot->shape_id);
        $this->assertSame('some description', $guidelineLabel->pivot->description);
        $this->assertNotNull($guidelineLabel->pivot->uuid);
    }

    public function testStoreUpdatesExisting()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
            'shape_id' => Shape::polygonId(),
            'description' => 'old description',
        ]);

        $this->beAdmin();
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'shape_id' => Shape::circleId(),
            'description' => 'new description',
        ])->assertStatus(200);

        $this->assertSame(1, $guideline->labels()->count());
        $guidelineLabel = $guideline->labels()->where('label_id', $label->id)->first();
        $this->assertSame(Shape::circleId(), $guidelineLabel->pivot->shape_id);
        $this->assertSame('new description', $guidelineLabel->pivot->description);
    }

    public function testStoreCreatesReferenceImage()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";
        $file = new UploadedFile(
            __DIR__.'/../../../../../files/test-image.jpg',
            'test-image.jpg',
            test: true
        );

        $this->beAdmin();
        $this->post($path, [
            'label_id' => $label->id,
            'reference_image' => $file,
        ])->assertStatus(201);

        $guidelineLabel = $guideline->labels()->where('label_id', $label->id)->first()->pivot;
        $disk->assertExists("{$guideline->id}/{$guidelineLabel->uuid}.jpg");
        $this->assertSame("{$guideline->id}/{$guidelineLabel->uuid}.jpg", $guidelineLabel->reference_image_path);
    }

    public function testStoreUpdatesReferenceImage()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $disk->put("{$guideline->id}/{$guidelineLabel->uuid}.jpg", 'old content');
        $guidelineLabel->update(['reference_image_path' => "{$guideline->id}/{$guidelineLabel->uuid}.jpg"]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";
        $file = new UploadedFile(
            __DIR__.'/../../../../../files/test-image.jpg',
            'test-image.jpg',
            test: true
        );

        $this->beAdmin();
        $this->post($path, [
            'label_id' => $label->id,
            'reference_image' => $file,
        ])->assertStatus(200);

        $this->assertNotEquals('old content', $disk->get("{$guideline->id}/{$guidelineLabel->uuid}.jpg"));
    }

    public function testStoreDeletesReferenceImageWhenNull()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $disk->put("{$guideline->id}/{$guidelineLabel->uuid}", 'content');
        $guidelineLabel->update(['reference_image_path' => "{$guideline->id}/{$guidelineLabel->uuid}"]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'reference_image' => null,
        ])->assertStatus(200);

        $disk->assertMissing("{$guideline->id}/{$guidelineLabel->uuid}");
        $this->assertNull($guidelineLabel->fresh()->reference_image_path);
    }

    public function testStoreKeepsReferenceImageWhenNotProvided()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $disk->put("{$guideline->id}/{$guidelineLabel->uuid}", 'content');
        $guidelineLabel->update(['reference_image_path' => "{$guideline->id}/{$guidelineLabel->uuid}"]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, ['label_id' => $label->id])->assertStatus(200);

        $disk->assertExists("{$guideline->id}/{$guidelineLabel->uuid}");
        $this->assertSame("{$guideline->id}/{$guidelineLabel->uuid}", $guidelineLabel->fresh()->reference_image_path);
    }

    public function testStoreRequiresLabelBelongsToProject()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        // Label from a label tree not attached to the project.
        $label = Label::factory()->create();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, ['label_id' => $label->id])->assertStatus(422);
    }

    public function testStoreValidatesShapeInOnlyShapes()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::polygonId()],
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'shape_id' => Shape::circleId(),
        ])->assertStatus(422);

        $this->json('POST', $path, [
            'label_id' => $label->id,
            'shape_id' => Shape::polygonId(),
        ])->assertStatus(201);
    }

    public function testStoreIgnoresOnlyShapesIfNotEnforced()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => false,
            'only_shapes' => [Shape::polygonId()],
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'shape_id' => Shape::circleId(),
        ])->assertStatus(201);
    }

    public function testStoreValidatesReferenceImageType()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels";

        $this->beAdmin();
        $this->post($path, [
            'label_id' => $label->id,
            'reference_image' => UploadedFile::fake()->create('document.txt'),
        ])->assertStatus(302);

        // Only JPEG images are allowed.
        $this->json('POST', $path, [
            'label_id' => $label->id,
            'reference_image' => new UploadedFile(
                __DIR__.'/../../../../../files/test-image.png',
                'test-image.png',
                test: true
            ),
        ])->assertStatus(422);
    }

    public function testDestroyRequiresAdmin()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels/{$label->id}";

        $this->doTestApiRoute('DELETE', $path);

        $this->beEditor();
        $this->delete($path)->assertStatus(403);

        $this->beAdmin();
        $this->delete($path)->assertStatus(200);
    }

    public function testDestroy()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels/{$label->id}";

        $this->beAdmin();
        $this->delete($path)->assertStatus(200);

        $this->assertFalse($guideline->labels()->where('label_id', $label->id)->exists());
    }

    public function testDestroyDeletesReferenceImage()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = $this->labelRoot();
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
        ]);
        $disk->put("{$guideline->id}/{$guidelineLabel->uuid}", 'content');
        $guidelineLabel->update(['reference_image_path' => "{$guideline->id}/{$guidelineLabel->uuid}"]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}/labels/{$label->id}";

        $this->beAdmin();
        $this->delete($path)->assertStatus(200);

        $disk->assertMissing("{$guideline->id}/{$guidelineLabel->uuid}");
    }
}
