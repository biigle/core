<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;

class AnyFileLabelControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);
        ImageLabelTest::create(['image_id' => $image->id]);
        // this image shouldn't appear
        ImageTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/files/filter/labels");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/files/filter/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/files/filter/labels")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $id]);
        VideoLabelTest::create(['video_id' => $video->id]);
        // this video shouldn't appear
        VideoTest::create(['volume_id' => $id, 'filename' => 'b.jpg']);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/files/filter/labels")
            ->assertStatus(200)
            ->assertExactJson([$video->id]);
    }
}
