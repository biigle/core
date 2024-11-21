<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\ProjectTest;
use Illuminate\Testing\TestResponse;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Symfony\Component\HttpFoundation\Response;

class FilterVideoAnnotationsByLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $video = VideoTest::create(['volume_id' => $id]);
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id]);

        $l1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = VideoAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        // annotation from other volume should not appear
        VideoAnnotationTest::create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();
        // take must be integer
        $this->json('GET', "/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}", ['take' => 'abc'])
            ->assertStatus(422);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid, $a1->id => $video->uuid]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l3->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a3->id => $video->uuid]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid]);
    }

    public function testIndexAnnotationSession()
    {
        $id = $this->volume()->id;
        $video = VideoTest::create(['volume_id' => $id]);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::today(),
        ]);

        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);

        $l1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);

        $l2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->editor()->id,
        ]);

        $l3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'label_id' => $l1->label_id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beEditor();

        // test hide own
        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $session->users()->attach($this->editor());

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid, $a3->id => $video->uuid]);

        // test hide other
        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid]);

        // test hide both
        $session->hide_own_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $video->uuid]);

        $session->users()->detach($this->editor());

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([
                $a1->id => $video->uuid,
                $a2->id => $video->uuid,
                $a3->id => $video->uuid,
            ]);
    }

    public function testIndexAnnotationSessionEdgeCaseHideOther()
    {
        $id = $this->volume()->id;
        $video = VideoTest::create(['volume_id' => $id]);
        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
        ]);
        $l1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
        ]);
        $l2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->admin()->id,
        ]);
        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::yesterday(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l2->label_id}")
            ->assertStatus(200)
            ->assertExactJson([]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->volume()->id;
        $video = VideoTest::create(['volume_id' => $id]);

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
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$a1->id => $video->uuid]);
    }

    public function testGetVolumeAnnotationLabels()
    {
        $id = $this->volume()->id;
        $project = ProjectTest::create();
        $img1 = VideoTest::create(['volume_id' => $id, 'filename' => 'abc.jpg']);
        $img2 = VideoTest::create(['volume_id' => $id, 'filename' => 'def.jpg']);
        $a1 = VideoAnnotationTest::create(['video_id' => $img1]);
        $a2 = VideoAnnotationTest::create(['video_id' => $img2->id]);
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id, 'label_id' => $l1->id]);
        $al2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l2->id]);

        $project->volumes()->attach($id);

        $this->doTestApiRoute('GET', "/api/v1/volume/{$id}/video-annotations");

        $this->beUser();
        $this->getJson("/api/v1/volume/{$id}/video-annotations")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/volume/{$id}/video-annotations")->assertStatus(200);

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

    public function testGetVolumeWithoutAnnotationsAnnotationLabels()
    {
        $id = $this->volume()->id;
        $project = ProjectTest::create();
        VideoTest::create(['volume_id' => $this->volume()->id]);
        $project->volumes()->attach($id);

        $this->doTestApiRoute('GET', "/api/v1/volume/{$id}/video-annotations");

        $this->beUser();
        $this->getJson("/api/v1/volume/{$id}/video-annotations")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->getJson("/api/v1/volume/{$id}/video-annotations")->assertStatus(200);

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
