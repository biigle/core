<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Storage;
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
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->volume()->id;
        $this->volume()->url = "test://images";
        $this->volume()->save();
        ImageTest::create(['filename' => 'no.jpg', 'volume_id' => $id]);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images");

        $this->beUser();
        $response = $this->post("/api/v1/volumes/{$id}/images");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post("/api/v1/volumes/{$id}/images");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->post("/api/v1/volumes/{$id}/images");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes/{$id}/images");
        $response->assertStatus(422);

        $this->assertEquals(1, $this->volume()->images()->count());
        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);
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

        // Image filename too long.
        $this->json('POST', "/api/v1/volumes/{$id}/images", [
                'images' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
            ])
            ->assertStatus(422);

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

    public function testStoreArray()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');
        $this->volume()->url = "test://images";
        $this->volume()->save();

        $id = $this->volume()->id;
        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/images", ['images' => ['1.jpg', '2.jpg']])
            ->assertStatus(200);
    }

    public function testStoreExists()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $this->volume()->url = "test://images";
        $this->volume()->save();

        $id = $this->volume()->id;
        ImageTest::create(['filename' => '1.jpg', 'volume_id' => $id]);
        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/images", ['images' => '1.jpg'])
            // Image already exists.
            ->assertStatus(422);
    }

    public function testStoreFilesExist()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/images", ['images' => '1.jpg'])
            ->assertStatus(422);
    }
}
