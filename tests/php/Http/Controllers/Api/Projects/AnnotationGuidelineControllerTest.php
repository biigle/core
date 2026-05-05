<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\Label;
use Biigle\Shape;

class AnnotationGuidelineControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";
        $this->doTestApiRoute('GET', $path);

        $this->beUser();
        $this->get($path)->assertStatus(403);

        $this->beGuest();
        $this->get($path)->assertStatus(404);

        $as1 = AnnotationGuideline::factory()->create(['project_id' => $id, 'description' => 'someDescription']);

        $this->get($path)
            ->assertStatus(200)
            ->assertJson([
                'id' => $as1->id,
                'project_id' => $id,
                'description' => 'someDescription',
                'labels' => [],
            ]);

        $label = Label::factory()->create();

        $as1->labels()->attach($label->id, [
            'shape_id' => Shape::polygonId(),
            'description' => 'labelDescription',
        ]);

        $this->get($path)
            ->assertStatus(200)
            ->assertJson([
                'id' => $as1->id,
                'project_id' => $id,
                'description' => 'someDescription',
                'labels' => [[
                    'id' => $label->id,
                    'pivot' => [
                        'shape_id' => Shape::polygonId(),
                        'description' => 'labelDescription',
                    ],
                ]],
            ]);
    }

    public function testStore()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guidelines";
        $this->doTestApiRoute('POST', $path);

        $data = ['description' => 'someDescription'];

        $this->beExpert();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', $path, $data)
            ->assertStatus(201);

        $as1 = $this->project()->annotationGuideline;

        $this->assertSame($as1->project_id, $id);
        $this->assertSame($as1->description, 'someDescription');

        $this->json('POST', $path, $data)
            ->assertStatus(422);
    }

    public function testUpdate()
    {
        $id = $this->project()->id;
        $g = AnnotationGuideline::factory()->create(['project_id' => $id, 'description' => 'old']);
        $path = "/api/v1/annotation-guidelines/{$g->id}";
        $this->doTestApiRoute('PUT', $path);

        $this->beExpert();
        $this->json('PUT', $path, ['description' => 'new'])
            ->assertStatus(403);

        $this->beAdmin();
        $this->json('PUT', $path, ['description' => 'new'])
            ->assertStatus(200);

        $this->assertSame('new', $g->fresh()->description);

        $this->json('PUT', $path, ['description' => null])
            ->assertStatus(200);

        $this->assertNull($g->fresh()->description);
    }

    public function testDestroy()
    {
        $id = $this->project()->id;
        $g = AnnotationGuideline::factory()->create(['project_id' => $id]);
        $path = "/api/v1/annotation-guidelines/{$g->id}";
        $this->doTestApiRoute('DELETE', $path);

        $this->beExpert();
        $this->delete($path)
            ->assertStatus(403);

        $this->beAdmin();
        $this->delete($path)
            ->assertStatus(200);

        $this->assertNull($g->fresh());
    }
}
