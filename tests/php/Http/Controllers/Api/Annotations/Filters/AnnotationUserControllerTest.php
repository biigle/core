<?php

namespace Biigle\Tests\Http\Controllers\Api\Annotations\Filters;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Carbon\Carbon;

class AnnotationUserControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $tid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
        $label = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        // image ID should be returned only once even with multiple annotations on it
        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = ImageAnnotationTest::create(['image_id' => $image2->id]);
        $label = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);
    }

    public function testIndexAnnotationSessionImage()
    {
        $tid = $this->volume()->id;

        $session = AnnotationSessionTest::create([
            'volume_id' => $tid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $image = ImageTest::create(['volume_id' => $tid]);
        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $uid = $this->editor()->id;

        $this->beEditor();
        $response = $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertExactJson([$image->id]);

        $session->users()->attach($this->editor());
        $response = $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertExactJson([]);
    }

    public function testIndexVideo()
    {
        $tid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $tid]);
        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);
        $label = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        // video ID should be returned only once even with multiple annotations on it
        VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this video shouldn't appear
        $video2 = VideoTest::create(['volume_id' => $tid, 'filename' => 'b.jpg']);
        $annotation = VideoAnnotationTest::create(['video_id' => $video2->id]);
        $label = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertStatus(200)
            ->assertExactJson([$video->id]);
    }

    public function testIndexAnnotationSessionVideo()
    {
        $tid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $session = AnnotationSessionTest::create([
            'volume_id' => $tid,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $video = VideoTest::create(['volume_id' => $tid]);
        $annotation = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::yesterday(),
        ]);
        $label = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $uid = $this->editor()->id;

        $this->beEditor();
        $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertExactJson([$video->id]);

        $session->users()->attach($this->editor());
        $this->get("/api/v1/volumes/{$tid}/files/filter/annotation-user/{$uid}")
            ->assertExactJson([]);
    }
}
