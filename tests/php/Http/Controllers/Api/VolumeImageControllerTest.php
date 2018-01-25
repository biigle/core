<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Cache;
use ApiTestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\ImageTest;

class VolumeImageControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/images");
        $response->assertStatus(200);

        $this->volume()->visibility_id = Visibility::$private->id;
        $this->volume()->save();
        Cache::flush();

        $response = $this->get("/api/v1/volumes/{$id}/images");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/images");
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testStore()
    {
        $id = $this->volume()->id;
        ImageTest::create(['filename' => 'no.jpg', 'volume_id' => $id]);
        $this->volume()->addMember($this->user(), Role::$admin);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images");

        $this->beAdmin();
        $response = $this->post("/api/v1/volumes/{$id}/images");
        $response->assertStatus(403);

        $this->beUser();
        $response = $this->json('POST', "/api/v1/volumes/{$id}/images");
        $response->assertStatus(422);

        $this->assertEquals(1, $this->volume()->images()->count());
        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);
        $this->expectsEvents('images.created');

        $response = $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.jpg, 1.jpg',
        ]);
        // error because of duplicate image
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.jpg, 2.jpg',
        ]);

        $response->assertStatus(200);

        $images = $this->volume()->images()
            ->where('filename', '!=', 'no.jpg')
            ->select('id', 'filename')->get();

        $response->assertExactJson($images->toArray());

        $this->assertEquals(1, $images->where('filename', '1.jpg')->count());
        $this->assertEquals(1, $images->where('filename', '2.jpg')->count());
    }
}
