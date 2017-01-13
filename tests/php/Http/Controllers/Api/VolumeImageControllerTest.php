<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;

class VolumeImageControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/images");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/images");
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testStore()
    {
        $id = $this->volume()->id;
        ImageTest::create(['filename' => 'no.jpg', 'volume_id' => $id]);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images");

        $this->beUser();
        $this->post("/api/v1/volumes/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/volumes/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/volumes/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/volumes/{$id}/images");
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $this->volume()->images()->count());
        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);
        $this->expectsEvents('images.created');

        $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.jpg, 1.jpg',
        ]);
        // error because of duplicate image
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/volumes/{$id}/images", [
            'images' => '1.jpg, 2.jpg',
        ]);

        $this->assertResponseOk();

        $images = $this->volume()->images()
            ->where('filename', '!=', 'no.jpg')
            ->select('id', 'filename')->get();

        $this->seeJsonEquals($images->toArray());

        $this->assertEquals(1, $images->where('filename', '1.jpg')->count());
        $this->assertEquals(1, $images->where('filename', '2.jpg')->count());
    }
}
