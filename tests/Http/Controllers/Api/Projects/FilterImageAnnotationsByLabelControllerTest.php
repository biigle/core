<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Project;
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
        $v1 = VolumeTest::create();
        $img1 = ImageTest::create(['volume_id' => $v1->id]);
        $a1 = ImageAnnotationTest::create(['image_id' => $img1]);
        $l1 = LabelTest::create();
        $al1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $l1->id]);


        $v2 = VolumeTest::create();
        $img2 = ImageTest::create(['volume_id' => $v2->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $img2->id]);
        $l2 = LabelTest::create();
        $al2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l2->id]);

        $this->project()->volumes()->attach([$v1->id, $v2->id]);
        $pid = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/image-annotations/");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$pid}/image-annotations/")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/projects/{$pid}/image-annotations/")->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $response->assertJsonFragment(['uuid' => $img1->uuid])
            ->assertJsonFragment([
                'labels' => [
                    'id' => $al1->id,
                    'annotation_id' => $a1->id,
                    'label_id' => $l1->id,
                    'created_at' => Carbon::parse($al1->created_at)->setTimezone('Europe/Berlin')->format('Y-m-d H:i:s'),
                    'label' => [
                        'id' => $l1->id,
                        'name' => $l1->name,
                        'color' => $l1->color
                    ]
                ]
            ])
            ->assertJsonFragment(['uuid' => $img2->uuid])
            ->assertJsonFragment([
                'labels' => [
                    'id' => $al2->id,
                    'annotation_id' => $a2->id,
                    'label_id' => $l2->id,
                    'created_at' => Carbon::parse($al2->created_at)->setTimezone('Europe/Berlin')->format('Y-m-d H:i:s'),
                    'label' => [
                        'id' => $l2->id,
                        'name' => $l2->name,
                        'color' => $l2->color
                    ]
                ]
            ]);

        $this->assertCount(2, json_decode($response->getContent()));
    }

    public function testGetEmptyProjectsAnnotationLabels()
    {
        $pid = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/image-annotations/");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$pid}/image-annotations/")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/projects/{$pid}/image-annotations/")->assertStatus(200);

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $this->assertEmpty(json_decode($response->getContent()));
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

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        $response = new TestResponse(
            new Response(
                $content,
                $response->baseResponse->getStatusCode(),
                $response->baseResponse->headers->all()
            )
        );

        $this->assertEmpty(json_decode($response->getContent()));
    }
}
