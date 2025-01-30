<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\Tests\ShapeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

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

    public function testFilters()
    {
        $id = $this->project()->id;

        $video = VideoTest::create(['volume_id' => $this->volume()->id]);

        $u1 = UserTest::create();
        $u2 = UserTest::create();

        $s1 = ShapeTest::create();
        $s2 = ShapeTest::create();

        $a1 = VideoAnnotationTest::create(['video_id' => $video->id, 'shape_id' =>$s1->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id, 'shape_id' =>$s1->id]);
        $a3 = VideoAnnotationTest::create(['video_id' => $video->id, 'shape_id' =>$s2->id]);

        $l1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id, 'user_id' =>$u1->id]);
        $l2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id, 'user_id' =>$u2->id]);
        $l3 = VideoAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $l1->label_id, 'user_id' =>$u2->id]);

        $this->beEditor();

        //Case 1: filter by shape
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]={$s1->id}")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid]);

        //Case 2: filter by user
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u2->id}")
            ->assertExactJson([$a2->id => $video->uuid, $a3->id => $video->uuid]);

        //Case 3: filter by shape and user
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]={$s2->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([$a3->id => $video->uuid]);

        //Case 4: combine user and shape with negatives
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]=-{$s2->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $video->uuid]);

        //Case 5: combine users with union
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid, $a3->id => $video->uuid]);

        //Case 6: combine uncompatible shapes
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([]);

        //Case 7: combine with a 'not' case
        $this->get("/api/v1/projects/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $video->uuid]);
    }
}
