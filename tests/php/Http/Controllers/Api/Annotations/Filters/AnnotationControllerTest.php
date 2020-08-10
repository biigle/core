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

class AnnotationControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        ImageAnnotationTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/files/filter/annotations");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);
    }

    public function testIndexAnnotationSessionImage()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2010-01-01',
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertJsonMissing([]);

        $session->users()->attach($this->guest());
        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertExactJson([]);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => Carbon::today(),
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertExactJson([$image->id]);
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $id]);
        VideoAnnotationTest::create(['video_id' => $video->id]);
        // this video shouldn't appear
        VideoTest::create(['volume_id' => $id, 'filename' => 'b.mp4']);

        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertStatus(200)
            ->assertExactJson([$video->id]);
    }

    public function testIndexAnnotationSessionVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $id]);
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => Carbon::today(),
        ]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $this->guest()->id,
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);
        $session->users()->attach($this->guest());

        $this->beGuest();

        $response = $this->get("/api/v1/volumes/{$id}/files/filter/annotations")
            ->assertExactJson([$video->id]);
    }
}
