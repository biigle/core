<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Events\ImagesDeleted;
use Biigle\Image;
use Biigle\Jobs\CreateNewImagesOrVideos;
use Biigle\Jobs\DeleteVolume;
use Biigle\MediaType;
use Biigle\Role;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Volume;
use Cache;
use Event;
use Exception;
use FileCache;
use Queue;
use Storage;

class ProjectVolumeControllerTest extends ApiTestCase
{
    private $volume;

    public function setUp(): void
    {
        parent::setUp();
        $this->volume = VolumeTest::create();
        $this->project()->volumes()->attach($this->volume);
        Storage::fake('test');
    }

    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/volumes");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $content = $response->getContent();
        $response->assertStatus(200);
        // response should not be an empty array
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
        $this->assertStringNotContainsString('pivot', $content);
    }

    public function testStoreImages()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/volumes");

        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/volumes");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes");
        // mssing arguments
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'files' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // invalid url format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // unknown storage disk
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg, 2.jpg',
        ]);
        // images directory dows not exist in storage disk
        $response->assertStatus(422);

        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '',
        ]);
        // images array is empty
        $response->assertStatus(422);

        $count = $this->project()->volumes()->count();
        $imageCount = Image::all()->count();

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.bmp',
        ]);
        // error because of unsupported image format
        $response->assertStatus(422);

        // Image filename too long.
        $this->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
            ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            // empty parts should be discarded
            'files' => '1.jpg, , 2.jpg, , ,',
        ]);
        $response->assertSuccessful();
        $content = $response->getContent();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            return $job->volume->id === $id &&
                in_array('1.jpg', $job->filenames) &&
                in_array('2.jpg', $job->filenames);
        });
    }

    public function testStoreJsonAttrs()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg',
            'video_link' => 'http://example.com',
            'gis_link' => 'http://my.example.com',
            'doi' => '10.3389/fmars.2017.00083',
        ]);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertEquals('http://example.com', $volume->video_link);
        $this->assertEquals('http://my.example.com', $volume->gis_link);
        $this->assertEquals('10.3389/fmars.2017.00083', $volume->doi);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type' => 'image',
            'files' => '1.jpg',
            'video_link' => '',
            'gis_link' => '',
            'doi' => '',
        ]);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNull($volume->video_link);
        $this->assertNull($volume->gis_link);
        $this->assertNull($volume->doi);
    }

    public function testStoreFilesArray()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => ['1.jpg', '2.jpg'],
            ])
            ->assertSuccessful();
    }

    public function testStoreFilesExist()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');

        $this->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg, 2.jpg',
            ])
            ->assertStatus(422);

        Storage::disk('test')->put('images/2.jpg', 'abc');

        $this->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg, 2.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreDeprecatedImagesAttribute()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $this->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'images' => '1.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreNoMediaTypeAttribute()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        $this->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'files' => '1.jpg',
            ])
            ->assertSuccessful();
    }

    public function testStoreUnableToParseUri()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/1.jpg', 'abc');
        Storage::disk('test')->put('images/2.jpg', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'https:///my/images',
                'media_type' => 'image',
                'files' => ['1.jpg', '2.jpg'],
            ])
            ->assertStatus(422);
    }

    public function testStoreFilesExistException()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        FileCache::shouldReceive('exists')
            ->andThrow(new Exception('Invalid MIME type.'));

        $response = $this->postJson("/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://images',
                'media_type' => 'image',
                'files' => '1.jpg',
            ])
            ->assertStatus(422);
        $this->assertStringContainsString('Some files could not be accessed. Invalid MIME type.', $response->getContent());
    }

    public function testStoreVideos()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // invalid url format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // unknown storage disk
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.mp4, 2.mp4',
        ]);
        // videos directory dows not exist in storage disk
        $response->assertStatus(422);

        Storage::disk('test')->makeDirectory('videos');
        Storage::disk('test')->put('videos/1.mp4', 'abc');
        Storage::disk('test')->put('videos/2.mp4', 'abc');

        $count = $this->project()->volumes()->count();
        $videoCount = Video::all()->count();

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.mp4, , 1.mp4',
        ]);
        // error because of duplicate video
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            'files' => '1.avi',
        ]);
        // error because of unsupported video format
        $response->assertStatus(422);

        // Video filename too long.
        $this->json('POST', "/api/v1/projects/{$id}/volumes", [
                'name' => 'my volume no. 1',
                'url' => 'test://videos',
                'media_type' => 'video',
                'files' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4',
            ])
            ->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://videos',
            'media_type' => 'video',
            // empty parts should be discarded
            'files' => '1.mp4, 2.mp4',
        ]);
        $response->assertSuccessful();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());

        $id = json_decode($response->getContent())->id;
        Queue::assertPushed(CreateNewImagesOrVideos::class, function ($job) use ($id) {
            return $job->volume->id === $id &&
                in_array('1.mp4', $job->filenames) &&
                in_array('2.mp4', $job->filenames);
        });
    }

    public function testAttach()
    {
        $tid = $this->volume->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;
        // $secondProject->addUserId($this->admin()->id, Role::adminId());

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");

        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::adminId());
        Cache::flush();

        $this->assertEmpty($secondProject->fresh()->volumes);
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(200);
        $this->assertNotEmpty($secondProject->fresh()->volumes);
    }

    public function testAttachDuplicate()
    {
        $tid = $this->volume->id;
        $pid = $this->project()->id;

        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$pid}/volumes/{$tid}")->assertStatus(200);
    }

    public function testDestroy()
    {
        $pid = $this->project()->id;
        $id = $this->volume->id;

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$pid}/volumes/{$id}");

        $this->beUser();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        // trying to delete without force
        $response->assertStatus(400);

        $otherVolume = VolumeTest::create();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$otherVolume->id}");
        // does not belong to the project
        $response->assertStatus(404);

        Queue::fake();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}", [
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $response->assertStatus(200);
        Queue::assertPushed(DeleteVolume::class, function ($job) use ($id) {
            return $id === $job->volume->id;
        });
        $this->assertFalse($this->project()->volumes()->exists());
    }
}
