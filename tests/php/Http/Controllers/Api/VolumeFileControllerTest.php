<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;
use Exception;
use FileCache;
use Storage;

class VolumeFileControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create(['volume_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/files");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/files")->assertStatus(403);

        $this->beGuest();
        $this
        ->get("/api/v1/volumes/{$id}/files")
            ->assertStatus(200)
            ->assertExactJson([$image->id]);
    }

    public function testIndexWrongMediaTypeImage()
    {
        $id = $this->volume()->id;
        VideoTest::create(['volume_id' => $id]);
        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$id}/files")->assertExactJson([]);
    }

    public function testIndexWrongMediaTypeVideo()
    {
        $volume = $this->volume(['media_type_id' => MediaType::videoId()]);
        ImageTest::create(['volume_id' => $volume->id]);
        $this->beGuest();
        $this->getJson("/api/v1/volumes/{$volume->id}/files")->assertExactJson([]);
    }

    public function testStoreImage()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->volume(['url' => 'test://images'])->id;
        ImageTest::create(['filename' => 'no.jpg', 'volume_id' => $id]);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/files");

        $this->beUser();
        $this->post("/api/v1/volumes/{$id}/files")->assertStatus(403);

        $this->beGuest();
        $this->post("/api/v1/volumes/{$id}/files")->assertStatus(403);

        $this->beEditor();
        $this->post("/api/v1/volumes/{$id}/files")->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/volumes/{$id}/files")->assertStatus(422);

        $this->assertEquals(1, $this->volume()->images()->count());
        $this->expectsJobs(ProcessNewVolumeFiles::class);
        $this->expectsEvents('images.created');

        $this
        ->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.jpg, 1.jpg',
        ])
            // error because of duplicate image
            ->assertStatus(422);

        $this
        ->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.mp4',
        ])
            // error because of unsupported image format
            ->assertStatus(422);

        // Image filename too long.
        $this
        ->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
        ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.jpg, 2.jpg',
        ]);

        $response->assertStatus(200);

        $images = $this->volume()->images()
            ->where('filename', '!=', 'no.jpg')
            ->select('id', 'filename')->get();

        $response->assertSimilarJson($images->toArray());

        $this->assertEquals(1, $images->where('filename', '1.jpg')->count());
        $this->assertEquals(1, $images->where('filename', '2.jpg')->count());
    }

    public function testStoreImageArray()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');
        $id = $this->volume(['url' => 'test://images'])->id;
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['files' => ['1.jpg', '2.jpg']])
            ->assertSuccessful();
    }

    public function testStoreDeprecatedImagesAttribute()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $id = $this->volume(['url' => 'test://images'])->id;
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['images' => ['1.jpg']])
            ->assertSuccessful();
    }

    public function testStoreImageExists()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $id = $this->volume(['url' => 'test://images'])->id;
        ImageTest::create(['filename' => '1.jpg', 'volume_id' => $id]);
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['files' => '1.jpg'])
            // Image already exists.
            ->assertStatus(422);
    }

    public function testStoreImageFileNotExists()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['files' => '1.jpg'])
            ->assertStatus(422);
    }

    public function testStoreVideo()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        Storage::disk('test')->put('videos/2.mp4', 'abc');

        $id = $this->volume([
            'media_type_id' => MediaType::videoId(),
            'url' => 'test://videos',
        ])->id;
        VideoTest::create(['filename' => 'no.mp4', 'volume_id' => $id]);

        $this->assertEquals(1, $this->volume()->videos()->count());
        $this->expectsJobs(ProcessNewVolumeFiles::class);

        $this->beAdmin();

        $this->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.mp4, 1.mp4',
        ])
            // error because of duplicate file
            ->assertStatus(422);

        $this->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.jpeg',
        ])
            // error because of unsupported file format
            ->assertStatus(422);

        // Video filename too long.
        $this->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4',
        ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/files", [
            'files' => '1.mp4, 2.mp4',
        ]);

        $response->assertStatus(200);

        $files = $this->volume()->files()
            ->where('filename', '!=', 'no.mp4')
            ->select('id', 'filename')->get();

        $response->assertSimilarJson($files->toArray());

        $this->assertEquals(1, $files->where('filename', '1.mp4')->count());
        $this->assertEquals(1, $files->where('filename', '2.mp4')->count());
    }

    public function testStoreVideoArray()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        Storage::disk('test')->put('videos/2.mp4', 'abc');
        $id = $this->volume([
            'media_type_id' => MediaType::videoId(),
            'url' => 'test://videos',
        ])->id;
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['files' => ['1.mp4', '2.mp4']])
            ->assertSuccessful();
    }

    public function testStoreVideoExists()
    {
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        $id = $this->volume([
            'media_type_id' => MediaType::videoId(),
            'url' => 'test://videos',
        ])->id;
        VideoTest::create(['filename' => '1.mp4', 'volume_id' => $id]);
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['images' => '1.mp4'])
            // Video already exists.
            ->assertStatus(422);
    }

    public function testStoreVideoFileNotExists()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->beAdmin();
        $this
        ->postJson("/api/v1/volumes/{$id}/files", ['images' => '1.mp4'])
            ->assertStatus(422);
    }

    public function testStoreFilesExistException()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        FileCache::shouldReceive('exists')
            ->andThrow(new Exception('Invalid MIME type.'));

        $response = $this
        ->postJson("/api/v1/volumes/{$id}/files", [
            'files' => '1.jpg',
        ])
            ->assertStatus(422);
        $this->assertStringContainsString('Some files could not be accessed. Invalid MIME type.', $response->getContent());
    }
}
