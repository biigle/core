<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes\Filters;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class ImageFilenameControllerTest extends ApiTestCase
{
    public function testIndex()
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

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$vid}/images/filter/filename/a*");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$vid}/images/filter/filename/a*");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/xyz.jpg")
            ->assertExactJson([]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/abcde.jpg")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/a*")
            ->assertExactJson([$image->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/*cde*")
            ->assertExactJson([$image->id, $image2->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/*.jpg")
            ->assertExactJson([$image->id, $image2->id, $image3->id]);
        $response->assertStatus(200);

        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/***.jpg")
            ->assertExactJson([$image->id, $image2->id, $image3->id]);
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
        $response = $this->json('GET', "/api/v1/volumes/{$vid}/images/filter/filename/*cde*\\")
            ->assertExactJson([]);
        $response->assertStatus(200);
    }
}
