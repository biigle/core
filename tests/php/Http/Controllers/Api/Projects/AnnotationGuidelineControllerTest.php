<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Label;
use Biigle\Shape;
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
            'shape_id' => Shape::polygonId(),
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
                        'shape_id' => Shape::polygonId(),
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
        $this->json('POST', $path, ['description' => 'someDescription'])->assertStatus(201);

        $guideline = $this->project()->annotationGuideline;
        $this->assertSame($id, $guideline->project_id);
        $this->assertSame('someDescription', $guideline->description);
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
        config(['projects.annotation_guideline_storage_disk' => 'annotation_storage']);
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
