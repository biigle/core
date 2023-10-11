<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;

class FilenamesControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $id = $this->volume()->id;

        $image1 = ImageTest::create([
            'volume_id' => $id,
            'filename' => '1.jpg',
        ]);
        $image2 = ImageTest::create([
            'volume_id' => $id,
            'filename' => '2.jpg',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/filenames/");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/filenames/")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/filenames/")
            ->assertExactJson([
                $image1->id => '1.jpg',
                $image2->id => '2.jpg',
            ])
            ->assertStatus(200);
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video1 = VideoTest::create([
            'volume_id' => $id,
            'filename' => '1.mp4',
        ]);
        $video2 = VideoTest::create([
            'volume_id' => $id,
            'filename' => '2.mp4',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/filenames/");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/filenames/")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/filenames/")
            ->assertExactJson([
                $video1->id => '1.mp4',
                $video2->id => '2.mp4',
            ])
            ->assertStatus(200);
    }
}
