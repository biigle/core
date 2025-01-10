<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;

class FilenameControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create([
            'volume_id' => $vid,
            'filename' => 'abcde.jpg',
        ]);
        $image2 = ImageTest::create([
            'volume_id' => $vid,
            'filename' => 'bcdef.jpg',
        ]);
        $image3 = ImageTest::create([
            'volume_id' => $vid,
            'filename' => '12345.jpg',
        ]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/files/filter/filename/a*");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$vid}/files/filter/filename/a*");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/xyz.jpg")
            ->assertExactJson([]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/abcde.jpg")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/a*")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/*cde*")
            ->assertSimilarJson([$image->id, $image2->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/*.jpg")
            ->assertSimilarJson([$image->id, $image2->id, $image3->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/***.jpg")
            ->assertSimilarJson([$image->id, $image2->id, $image3->id]);
        $response->assertStatus(200);
    }

    public function testIndexEscape()
    {
        $vid = $this->volume()->id;

        $image = ImageTest::create([
            'volume_id' => $vid,
            'filename' => 'abcde.jpg',
        ]);
        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/*cde*%5C")
            ->assertExactJson([]);
        $response->assertStatus(200);
    }

    public function testIndexVideo()
    {
        $vid = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $video = VideoTest::create([
            'volume_id' => $vid,
            'filename' => 'abcde.mp4',
        ]);
        $video2 = VideoTest::create([
            'volume_id' => $vid,
            'filename' => 'bcdef.mp4',
        ]);
        $video3 = VideoTest::create([
            'volume_id' => $vid,
            'filename' => '12345.mp4',
        ]);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/xyz.mp4")
            ->assertExactJson([]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/abcde.mp4")
            ->assertExactJson([$video->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/a*")
            ->assertExactJson([$video->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/*cde*")
            ->assertSimilarJson([$video->id, $video2->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/*.mp4")
            ->assertSimilarJson([$video->id, $video2->id, $video3->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/files/filter/filename/***.mp4")
            ->assertSimilarJson([$video->id, $video2->id, $video3->id]);
        $response->assertStatus(200);
    }
}
