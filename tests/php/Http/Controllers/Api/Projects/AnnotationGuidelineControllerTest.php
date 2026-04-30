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
    public function testIndex()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guideline";
        $this->doTestApiRoute('GET', $path);

        $this->beGuest();
        $this->get($path)
            ->assertStatus(403);

        $this->beUser();
        $this->get($path)
            ->assertStatus(403);

        $this->beEditor();
        $this->get($path)
            ->assertStatus(403);

        $this->beAdmin();
        $this->get($path)
            ->assertStatus(404);

        $as1 = AnnotationGuideline::create(['project' => $id, 'description' => 'someDescription']);

        $this->get($path)
            ->assertStatus(200)
            ->assertJson(
                [
                    'annotation_guideline' =>
                        ['id' => $as1->id, 'project' => $id, 'description' => 'someDescription'],
                    'annotation_guideline_labels' => [],
                ]
            );
        $label = Label::factory()->create();

        $asl1 = AnnotationGuidelineLabel::create(
            [
                'annotation_guideline' => $as1->id,
                'label' => $label->id,
                'shape' => Shape::polygonId(),
                'description' => 'labelDescription',
                'reference_image' => false,
            ]
        );

        $this->get($path)
            ->assertStatus(200)
            ->assertJson(
                [
                    'annotation_guideline' =>
                        ['id' => $as1->id, 'project' => $id, 'description' => 'someDescription'],
                    'annotation_guideline_labels' => [[
                        'description' => 'labelDescription',
                        'label' => $label->toArray(),
                        'shape' => Shape::polygonId(),
                    ]],
                ]
            );
    }

    public function testUpdate()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-guideline";
        $this->doTestApiRoute('POST', $path);

        $data = ['description' => 'someDescription'];

        $this->beGuest();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beUser();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beEditor();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', $path, $data)
            ->assertStatus(200);

        $as1 = AnnotationGuideline::where(['project' => $id])->first();

        $this->assertSame($as1->project, $id);
        $this->assertSame($as1->description, 'someDescription');

        $this->json('POST', $path, ['project' => $id, 'description' => 'someNewDescription'])
            ->assertStatus(200);

        $as2 = AnnotationGuideline::where(['project' => $id])->first();

        $this->assertSame($as2->id, $as1->id);
        $this->assertSame($as2->project, $id);
        $this->assertSame($as2->description, 'someNewDescription');
    }

    public function testDelete()
    {
        $id = $this->project()->id;
        config(['projects.annotation_guideline_storage_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $path = "/api/v1/projects/{$id}/annotation-guideline";
        $this->doTestApiRoute('DELETE', $path);

        $this->beGuest();
        $this->delete($path)
            ->assertStatus(403);

        $this->beUser();
        $this->delete($path)
            ->assertStatus(403);

        $this->beEditor();
        $this->delete($path)
            ->assertStatus(403);

        $this->beAdmin();
        $this->delete($path)
            ->assertStatus(404);

        AnnotationGuideline::create(['project' => $id, 'description' => 'someDescription']);

        //We also test that the files are cleared
        $disk->put("$id/somefile.png", 'content');

        $this->delete($path)
            ->assertStatus(200);

        $this->assertEmpty(AnnotationGuideline::where(['project' => $id])->first());
        $disk->assertMissing("$id/somefile.png");
    }
}
