<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;

class FileLabelUserControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $vid]);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this image shouldn't appear
        $image2 = ImageTest::create(['volume_id' => $vid, 'filename' => 'b.jpg']);
        $label = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}")
            ->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }

    public function testIndexVideo()
    {
        $vid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create(['volume_id' => $vid]);
        $label = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => $this->editor()->id,
        ]);
        $uid = $this->editor()->id;

        // this video shouldn't appear
        $video2 = VideoTest::create(['volume_id' => $vid, 'filename' => 'b.jpg']);
        $label = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => $this->admin()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}")
            ->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$vid}/files/filter/labels/users/{$uid}")
            ->assertStatus(200)
            ->assertExactJson([$video->id]);
    }
}
