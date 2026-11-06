<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Enums\Shape;
use Biigle\Label;
use Storage;

class AnnotationGuidelineControllerTest extends ApiTestCase
{
    public function testIndexRequiresMembership()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->doTestApiRoute('GET', $path);

        $this->beUser();
        $this->get($path)->assertStatus(403);

        $this->beGuest();
        $this->get($path)->assertStatus(404);
    }

    public function testIndex()
    {
        $id = $this->project()->id;
        $guideline = AnnotationGuideline::factory()->create(['project_id' => $id]);
        $label = Label::factory()->create();
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
            'shape' => Shape::POLYGON->value,
            'description' => 'labelDescription',
        ]);
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beGuest();
        $this->get($path)
            ->assertStatus(200)
            ->assertJson([
                'labels' => [[
                    'id' => $label->id,
                    'pivot' => [
                        'shape' => Shape::POLYGON->value,
                        'description' => 'labelDescription',
                    ],
                ]],
            ]);
    }

    public function testStoreRequiresAdmin()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->doTestApiRoute('POST', $path);

        $this->beEditor();
        $this->json('POST', $path, ['description' => 'someDescription'])->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', $path, ['description' => 'someDescription'])->assertStatus(201);
    }

    public function testStore()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [
            'description' => 'someDescription',
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value, Shape::CIRCLE->value],
        ])->assertStatus(201);

        $guideline = $this->project()->annotationGuideline;
        $this->assertSame($id, $guideline->project_id);
        $this->assertSame('someDescription', $guideline->description);
        $this->assertTrue($guideline->enforced);
        $this->assertEquals([Shape::POLYGON->value, Shape::CIRCLE->value], $guideline->only_shapes);
    }

    public function testStoreCastsOnlyShapesToInt()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [
            'enforced' => true,
            'only_shapes' => [(string) Shape::POLYGON->value],
        ])->assertStatus(201);

        $guideline = $this->project()->annotationGuideline;
        $this->assertSame([Shape::POLYGON->value], $guideline->only_shapes);
    }

    public function testStoreDefaultsEnforcedToFalse()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [])->assertStatus(201);

        $guideline = $this->project()->annotationGuideline;
        $this->assertFalse($guideline->enforced);
        $this->assertNull($guideline->only_shapes);
    }

    public function testStoreValidatesOnlyShapesUnique()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value, Shape::POLYGON->value],
        ])->assertStatus(422);
    }

    public function testStoreValidatesOnlyShapesExist()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [
            'enforced' => true,
            'only_shapes' => [-1],
        ])->assertStatus(422);
    }

    public function testStoreValidatesOnlyShapesRequiresEnforced()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, [
            'only_shapes' => [Shape::POLYGON->value],
        ])->assertStatus(422);

        $this->json('POST', $path, [
            'enforced' => false,
            'only_shapes' => [Shape::POLYGON->value],
        ])->assertStatus(422);
    }

    public function testStoreFailsIfGuidelineExists()
    {
        $id = $this->project()->id;
        AnnotationGuideline::factory()->create(['project_id' => $id]);
        $path = "/api/v1/projects/{$id}/annotation-guidelines";

        $this->beAdmin();
        $this->json('POST', $path, ['description' => 'someDescription'])->assertStatus(422);
    }

    public function testUpdateRequiresAdmin()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->doTestApiRoute('PUT', $path);

        $this->beEditor();
        $this->json('PUT', $path, ['description' => 'new'])->assertStatus(403);

        $this->beAdmin();
        $this->json('PUT', $path, ['description' => 'new'])->assertStatus(200);
    }

    public function testUpdate()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'description' => 'old',
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, ['description' => 'new'])->assertStatus(200);
        $this->assertSame('new', $guideline->fresh()->description);

        $this->json('PUT', $path, ['description' => null])->assertStatus(200);
        $this->assertNull($guideline->fresh()->description);
    }

    public function testUpdateClearDescriptionOnMissing()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'description' => 'old',
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path)->assertStatus(200);
        $this->assertNull($guideline->fresh()->description);
    }

    public function testUpdateEnforcedAndOnlyShapes()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => false,
            'only_shapes' => null,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value, Shape::CIRCLE->value],
        ])->assertStatus(200);

        $guideline->refresh();
        $this->assertTrue($guideline->enforced);
        $this->assertEquals([Shape::POLYGON->value, Shape::CIRCLE->value], $guideline->only_shapes);
    }

    public function testUpdateNullOnlyShapesOnMissing()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value],
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, ['only_shapes' => null])->assertStatus(200);

        $this->assertNull($guideline->fresh()->only_shapes);
    }

    public function testUpdateNullOnlyShapesOnEmptyArray()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value],
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, ['only_shapes' => []])->assertStatus(200);

        $this->assertNull($guideline->fresh()->only_shapes);
    }

    public function testUpdateClearEnforcedOnMissing()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path)->assertStatus(200);
        $this->assertFalse($guideline->fresh()->enforced);
    }

    public function testUpdateValidatesOnlyShapesUnique()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value, Shape::POLYGON->value],
        ])->assertStatus(422);
    }

    public function testUpdateCastsOnlyShapesToInt()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'enforced' => true,
            'only_shapes' => [(string) Shape::POLYGON->value],
        ])->assertStatus(200);

        $this->assertSame([Shape::POLYGON->value], $guideline->fresh()->only_shapes);
    }

    public function testUpdateNullsLabelShapesNotInOnlyShapes()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $keepLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'shape' => Shape::POLYGON->value,
        ]);
        $clearLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'shape' => Shape::CIRCLE->value,
        ]);
        $noShapeLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'shape' => null,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'enforced' => true,
            'only_shapes' => [Shape::POLYGON->value],
        ])->assertStatus(200);

        $this->assertSame(Shape::POLYGON->value, $keepLabel->fresh()->shape);
        $this->assertNull($clearLabel->fresh()->shape);
        $this->assertNull($noShapeLabel->fresh()->shape);
    }

    public function testUpdateDoesNotNullLabelShapesIfOnlyShapesMissing()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $label = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'shape' => Shape::CIRCLE->value,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, ['description' => 'new'])->assertStatus(200);

        $this->assertSame(Shape::CIRCLE->value, $label->fresh()->shape);
    }

    public function testUpdateDoesNotNullLabelShapesIfOnlyShapesNull()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'only_shapes' => [Shape::POLYGON->value],
        ]);
        $label = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'shape' => Shape::CIRCLE->value,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, ['only_shapes' => null])->assertStatus(200);

        $this->assertSame(Shape::CIRCLE->value, $label->fresh()->shape);
    }

    public function testUpdateValidatesOnlyShapesExist()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'enforced' => true,
            'only_shapes' => [-1],
        ])->assertStatus(422);
    }

    public function testUpdateValidatesOnlyShapesRequiresEnforced()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->json('PUT', $path, [
            'only_shapes' => [Shape::POLYGON->value],
        ])->assertStatus(422);

        $this->json('PUT', $path, [
            'enforced' => false,
            'only_shapes' => [Shape::POLYGON->value],
        ])->assertStatus(422);
    }

    public function testDestroyRequiresAdmin()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

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
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->delete($path)->assertStatus(200);

        $this->assertNull($guideline->fresh());
    }

    public function testDestroyDeletesStorageDirectory()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
        ]);
        $disk->put("{$guideline->id}/reference.png", 'content');
        $path = "/api/v1/annotation-guidelines/{$guideline->id}";

        $this->beAdmin();
        $this->delete($path)->assertStatus(200);

        $disk->assertMissing("{$guideline->id}/reference.png");
    }
}
