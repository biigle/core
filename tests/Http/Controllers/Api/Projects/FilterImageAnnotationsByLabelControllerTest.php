<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Illuminate\Testing\TestResponse;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Symfony\Component\HttpFoundation\Response;

class FilterImageAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image->id]);

        $l1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = ImageAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        ImageAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();
        // take must be integer
        $this->json('GET', "/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}", ['take' => 'abc'])
            ->assertStatus(422);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $image->uuid, $a1->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l3->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a3->id => $image->uuid]);

        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $image->uuid]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $l1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$id}/image-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id => $image->uuid]);
    }

    public function testGetProjectsAnnotationLabels()
    {
        $vol = VolumeTest::create();
        $img = ImageTest::create(['volume_id' => $vol->id]);
        $a = ImageAnnotationTest::create(['image_id' => $img]);
        $l = LabelTest::create();
        $expectedLabel = [...$l->get()->toArray()[0], "uuid" => $l->uuid, "count" => 2];
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a->id, 'label_id' => $l->id]);

        $this->project()->volumes()->attach($vol);
        $pid = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/image-annotations/");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$pid}/image-annotations/")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/projects/{$pid}/image-annotations/")->assertStatus(200);
        $content = json_decode($response->getContent())[0];

        $this->assertNotEmpty($content);
        $this->assertEquals($expectedLabel, (array) $content);
    }

    public function testGetProjectsWithoutAnnotationsAnnotationLabels()
    {
        $project = ProjectTest::create();
        $v1 = VolumeTest::create();
        ImageTest::create(['volume_id' => $v1->id]);

        $project->volumes()->attach($v1->id);
        $pid = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/image-annotations/");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$pid}/image-annotations/")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/projects/{$pid}/image-annotations/")->assertStatus(200);
        $content = json_decode($response->getContent());

        $this->assertEmpty($content);
    }
}
