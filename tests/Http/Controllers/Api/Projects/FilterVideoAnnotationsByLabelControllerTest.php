<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\MediaType;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Illuminate\Testing\TestResponse;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Symfony\Component\HttpFoundation\Response;

class FilterVideoAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id]);

        $l1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = VideoAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        VideoAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();
        // take must be integer
        $this->json('GET', "/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}", ['take' => 'abc'])
            ->assertStatus(422);

        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid, $a1->id => $video->uuid]);

        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l3->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a3->id => $video->uuid]);

        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->project()->id;
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
        ]);

        $l1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id => $video->uuid]);
    }

    public function testGetProjectsAnnotationLabels()
    {
        $v1 = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $vid1 = VideoTest::create(['volume_id' => $v1->id]);
        $a1 = VideoAnnotationTest::create(['video_id' => $vid1]);
        $l1 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $l1->id]);


        $v2 = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $vid2 = VideoTest::create(['volume_id' => $v2->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $vid2->id]);
        $l2 = LabelTest::create();
        $al2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l2->id]);

        $this->project()->volumes()->attach([$v1->id, $v2->id]);
        $pid = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$pid}/video-annotations/");

        $this->beUser();
        $this->getJson("/api/v1/projects/{$pid}/video-annotations/")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/projects/{$pid}/video-annotations/")->assertStatus(200);

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

        $response->assertJsonFragment(['uuid' => $vid1->uuid])
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
            ->assertJsonFragment(['uuid' => $vid2->uuid])
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

    public function testGetProjectWithoutAnnotationsAnnotationLabels()
    {
        $project = ProjectTest::create();
        $v1 = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        VideoTest::create(['volume_id' => $v1->id]);

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
