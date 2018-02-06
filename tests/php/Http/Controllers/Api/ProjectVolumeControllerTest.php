<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Event;
use Cache;
use Storage;
use Biigle\Role;
use Biigle\Image;
use ApiTestCase;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;

class ProjectVolumeControllerTest extends ApiTestCase
{
    private $volume;

    public function setUp()
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
        $this->assertNotContains('pivot', $content);
    }

    public function testStore()
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
            'images' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, 2.jpg',
        ]);
        // invalid url format
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, 2.jpg',
        ]);
        // unknown storage disk
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, 2.jpg',
        ]);
        // images directory dows not exist in storage disk
        $response->assertStatus(422);

        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/file.txt', 'abc');

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '',
        ]);
        // images array is empty
        $response->assertStatus(422);

        $count = $this->project()->volumes()->count();
        $imageCount = Image::all()->count();

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $response->assertStatus(422);

        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);

        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            // empty parts should be discarded
            'images' => '1.jpg, , 2.jpg, , ,',
        ]);
        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertEquals($count + 1, $this->project()->volumes()->count());
        $this->assertEquals($imageCount + 2, Image::all()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $id = json_decode($content)->id;
        $volume = Volume::find($id);
        $this->assertTrue($volume->images()->where('filename', '1.jpg')->exists());
        $this->assertTrue($volume->images()->where('filename', '2.jpg')->exists());
    }

    public function testStoreJsonAttrs()
    {
        Storage::disk('test')->makeDirectory('images');
        Storage::disk('test')->put('images/file.txt', 'abc');

        $id = $this->project()->id;
        $this->beAdmin();
        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);
        $response = $this->json('POST', "/api/v1/projects/{$id}/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'test://images',
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg',
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
            'media_type_id' => MediaType::$timeSeriesId,
            'images' => '1.jpg',
            'video_link' => '',
            'gis_link' => '',
            'doi' => '',
        ]);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertNull($volume->video_link);
        $this->assertNull($volume->gis_link);
        $this->assertNull($volume->doi);
    }

    public function testAttach()
    {
        $tid = $this->volume->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;
        // $secondProject->addUserId($this->admin()->id, Role::$admin->id);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");

        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::$admin->id);
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
        $response = $this->json('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(422);
    }

    public function testDestroy()
    {
        $pid = $this->project()->id;
        $id = $this->volume->id;
        $image = ImageTest::create(['volume_id' => $id]);

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

        Event::shouldReceive('fire')
            ->once()
            ->with('images.cleanup', [[$image->uuid]]);

        Event::shouldReceive('dispatch'); // catch other events

        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}", [
            'force' => 'abc',
        ]);
        // deleting with force succeeds
        $response->assertStatus(200);
        $this->assertNull($this->volume->fresh());
    }
}
