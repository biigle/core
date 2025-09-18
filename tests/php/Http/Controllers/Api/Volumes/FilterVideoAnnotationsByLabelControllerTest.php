<?php
namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ShapeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Carbon\Carbon;

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

    public function testFilters()
    {
        $id = $this->volume()->id;

        $video = VideoTest::create(['volume_id' => $id]);

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
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]={$s1->id}")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid]);

        //Case 2: filter by user
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u2->id}")
            ->assertExactJson([$a2->id => $video->uuid, $a3->id => $video->uuid]);

        //Case 3: filter by shape and user
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]={$s2->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([$a3->id => $video->uuid]);

        //Case 4: combine user and shape with negatives
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]=-{$s2->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $video->uuid]);

        //Case 5: combine filters (excluding values and not) with union
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid, $a3->id => $video->uuid]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]={$s1->id}&user_id[]={$u1->id}&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?shape_id[]=-{$s1->id}&user_id[]={$u1->id}&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a3->id => $video->uuid]);

        //Case 6: combine incompatible filters: annotations should be of user1 and/or user2 at the same time
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]={$u2->id}&union=0")
            ->assertExactJson([]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u1->id}&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid, $a3->id => $video->uuid]);

        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u1->id}&shape_id[]=1&union=1")
            ->assertExactJson([$a1->id => $video->uuid, $a2->id => $video->uuid, $a3->id => $video->uuid]);

        //Case 7: combine with a 'not' case
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?user_id[]={$u1->id}&user_id[]=-{$u2->id}&union=0")
            ->assertExactJson([$a1->id => $video->uuid]);
    }

    public function testIndexFilenameFilter()
    {
        $id = $this->volume()->id;

        $video1 = VideoTest::create(['volume_id' => $id, 'filename' => 'test_video_001.mp4']);
        $video2 = VideoTest::create(['volume_id' => $id, 'filename' => 'test_video_002.mp4']);
        $video3 = VideoTest::create(['volume_id' => $id, 'filename' => 'another_file.webm']);

        $a1 = VideoAnnotationTest::create(['video_id' => $video1->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);
        $a3 = VideoAnnotationTest::create(['video_id' => $video3->id]);

        $l1 = VideoAnnotationLabelTest::create(['annotation_id' => $a1->id]);
        $l2 = VideoAnnotationLabelTest::create(['annotation_id' => $a2->id, 'label_id' => $l1->label_id]);
        $l3 = VideoAnnotationLabelTest::create(['annotation_id' => $a3->id, 'label_id' => $l1->label_id]);

        $this->beEditor();

        // Test filename pattern matching with wildcards
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?filename[]=test_video_*")
            ->assertExactJson([$a2->id => $video2->uuid, $a1->id => $video1->uuid]);

        // Test exact filename matching
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?filename[]=test_video_001.mp4")
            ->assertExactJson([$a1->id => $video1->uuid]);

        // Test filename extension matching
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?filename[]=*.mp4")
            ->assertExactJson([$a2->id => $video2->uuid, $a1->id => $video1->uuid]);

        // Test negative filename filtering
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?filename[]=-test_video_*")
            ->assertExactJson([$a3->id => $video3->uuid]);

        // Test union mode with filename patterns
        $this->get("/api/v1/volumes/{$id}/video-annotations/filter/label/{$l1->label_id}?filename[]=test_video_001.mp4&filename[]=another_file.webm&union=1")
            ->assertExactJson([$a3->id => $video3->uuid, $a1->id => $video1->uuid]);
    }
}
