<?php

namespace Biigle\Tests\Http\Controllers\Api;

use File;
use Cache;
use ApiTestCase;
use Biigle\Role;
use Biigle\Image;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\Visibility;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\ImageLabelTest;

class VolumeControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->volume()->id;
        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}");
        $response->assertStatus(200);

        $this->volume()->visibility_id = Visibility::$private->id;
        $this->volume()->save();
        Cache::flush();

        $response = $this->get("/api/v1/volumes/{$id}");
        $response->assertStatus(403);
        Cache::flush();

        $this->volume()->addMember($this->user(), Role::$admin);
        $response = $this->get("/api/v1/volumes/{$id}");
        $response->assertStatus(200);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', "/api/v1/volumes");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/volumes");
        // mssing arguments
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => 99999,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg, 2.jpg',
        ]);
        // media type does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => 9999,
            'images' => '1.jpg, 2.jpg',
        ]);
        // visibility does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '',
        ]);
        // images array is empty
        $response->assertStatus(422);

        $count = $this->project()->volumes()->count();
        $imageCount = Image::all()->count();

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg, , 1.jpg',
        ]);
        // error because of duplicate image
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $response->assertStatus(422);

        File::shouldReceive('exists')->times(3)->andReturn(false, true, true);
        File::shouldReceive('isReadable')->twice()->andReturn(false, true);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg',
        ]);
        // volume url does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg',
        ]);
        // volume url is not readable
        $response->assertStatus(422);

        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            // empty parts should be discarded
            'images' => '1.jpg, , 2.jpg, , ,',
        ]);
        $response->assertStatus(200);
        $volume = Volume::find(json_decode($response->getContent())->id);
        $this->assertTrue($volume->images()->where('filename', '1.jpg')->exists());
        $this->assertTrue($volume->images()->where('filename', '2.jpg')->exists());
        $member = $volume->members()->find($this->user()->id);
        $this->assertNotNull($member);
        $this->assertEquals(Role::$admin->id, $member->role_id);
    }

    public function testStoreJsonAttrs()
    {
        File::shouldReceive('exists')->twice()->andReturn(true);
        File::shouldReceive('isReadable')->twice()->andReturn(true);

        $this->beUser();
        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);
        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg',
            'video_link' => 'http://example.com',
            'gis_link' => 'http://my.example.com',
            'doi' => '10.3389/fmars.2017.00083',
        ]);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertEquals('http://example.com', $volume->video_link);
        $this->assertEquals('http://my.example.com', $volume->gis_link);
        $this->assertEquals('10.3389/fmars.2017.00083', $volume->doi);

        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
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

    public function testStoreTargetProject()
    {
        $this->beEditor();
        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg',
            'project_id' => $this->project()->id,
        ]);
        // User has no permission to attach a volume to the project.
        $response->assertStatus(422);

        File::shouldReceive('exists')->once()->andReturn(true);
        File::shouldReceive('isReadable')->once()->andReturn(true);
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes", [
            'name' => 'my volume no. 1',
            'url' => 'random',
            'media_type_id' => MediaType::$timeSeriesId,
            'visibility_id' => Visibility::$private->id,
            'images' => '1.jpg',
            'project_id' => $this->project()->id,
        ]);
        $response->assertStatus(200);
        $volume = Volume::orderBy('id', 'desc')->first();
        $this->assertEquals($this->project()->id, $volume->projects()->first()->id);
        $this->markTestIncomplete('Implement volume_authorized_project');
        $this->assertEquals($this->project()->id, $volume->authorizedProjects()->first()->id);
    }

    public function testUpdate()
    {
        $this->doesntExpectJobs(\Biigle\Jobs\GenerateThumbnails::class);

        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::$timeSeriesId;
        $this->volume()->visibility_id = Visibility::$public->id;
        $this->volume()->save();
        $this->volume()->addMember($this->user(), Role::$admin);

        $this->doTestApiRoute('PUT', "/api/v1/volumes/{$id}");

        $this->beAdmin();
        $response = $this->put("/api/v1/volumes/{$id}");
        $response->assertStatus(403);

        $this->beUser();
        $this->assertNotEquals('the new volume', $this->volume()->fresh()->name);
        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'name' => 'the new volume',
            'media_type_id' => MediaType::$locationSeriesId,
            'visibility_id' => Visibility::$private->id,
        ]);
        $response->assertStatus(200);
        $this->assertEquals('the new volume', $this->volume()->fresh()->name);
        $this->assertEquals(MediaType::$locationSeriesId, $this->volume()->fresh()->media_type_id);
        $this->assertEquals(Visibility::$private->id, $this->volume()->fresh()->visibility_id);
    }

    public function testUpdateJsonAttrs()
    {
        $volume = $this->volume();
        $volume->addMember($this->user(), Role::$admin);
        $id = $volume->id;
        $this->doTestApiRoute('PUT', "/api/v1/volumes/{$id}");

        $this->beUser();
        $this->assertNull($volume->fresh()->video_link);
        $this->assertNull($volume->fresh()->gis_link);
        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'video_link' => 'http://example.com',
            'gis_link' => 'http://my.example.com',
            'doi' => '10.3389/fmars.2017.00083',
        ]);
        $response->assertStatus(200);
        $this->volume()->refresh();
        $this->assertEquals('http://example.com', $this->volume()->video_link);
        $this->assertEquals('http://my.example.com', $this->volume()->gis_link);
        $this->assertEquals('10.3389/fmars.2017.00083', $this->volume()->doi);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'video_link' => '',
            'gis_link' => '',
            'doi' => '',
        ]);
        $response->assertStatus(200);
        $this->volume()->refresh();
        $this->assertNull($this->volume()->video_link);
        $this->assertNull($this->volume()->gis_link);
        $this->assertNull($this->volume()->doi);
    }

    public function testUpdateUrl()
    {
        $this->volume()->addMember($this->user(), Role::$admin);
        // URL validation
        File::shouldReceive('exists')->once()->andReturn(true);
        File::shouldReceive('isReadable')->once()->andReturn(true);

        $this->beUser();
        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);
        $response = $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => '/new/url',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('/new/url', $this->volume()->fresh()->url);
    }

    public function testUpdateValidation()
    {
        $id = $this->volume()->id;
        $this->volume()->addMember($this->user(), Role::$admin);
        $this->beUser();
        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'media_type_id' => '',
        ]);
        // media type id must not be empty if present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'media_type_id' => 999,
        ]);
        // media type id does not exist
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'visibility_id' => '',
        ]);
        // visibility id must not be empty if present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'visibility_id' => 999,
        ]);
        // visibility id does not exist
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/volumes/{$id}", [
            'url' => '',
        ]);
        // url must not be empty if present
        $response->assertStatus(422);
    }

    public function testUpdateRedirect()
    {
        $id = $this->volume()->id;
        $this->volume()->addMember($this->user(), Role::$admin);
        $this->beUser();
        $response = $this->put("/api/v1/volumes/{$id}", [
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $response->assertSessionHas('saved', false);

        $this->get('/');
        $response = $this->put("/api/v1/volumes/{$id}", [
            'name' => 'abc',
        ]);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);
    }

    public function testDestroy()
    {
        $id = $this->volume()->id;
        $this->volume()->addMember($this->user(), Role::$admin);

        $this->doTestApiRoute('DELETE', "/api/v1/volumes/{$id}");

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/volumes/{$id}");
        $response->assertStatus(403);

        $this->beUser();
        $this->assertNotNull($this->volume()->fresh());
        $response = $this->json('DELETE', "/api/v1/volumes/{$id}");
        $response->assertStatus(200);
        $this->assertNull($this->volume()->fresh());
    }

    public function testDestroyAnnotations()
    {
        $id = $this->volume()->id;
        $this->volume()->addMember($this->user(), Role::$admin);
        AnnotationTest::create([
            'image_id' => ImageTest::create(['volume_id' => $id]),
        ]);
        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/volumes/{$id}");
        $response->assertStatus(403);
    }

    public function testDestroyImageLabels()
    {
        $id = $this->volume()->id;
        $this->volume()->addMember($this->user(), Role::$admin);
        ImageLabelTest::create([
            'image_id' => ImageTest::create(['volume_id' => $id]),
        ]);
        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/volumes/{$id}");
        $response->assertStatus(403);
    }
}
