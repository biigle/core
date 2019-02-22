<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Storage;
use ApiTestCase;
use Biigle\MediaType;

class VolumeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        // Create the volume.
        $this->volume();
        $this->doTestApiRoute('GET', '/api/v1/volumes/');

        $this->beUser();
        $this->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->beGuest();
        $this->get('/api/v1/volumes/')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $this->volume()->id])
            ->assertJsonFragment(['name' => $this->project()->name]);
    }

    public function testShow()
    {
        $id = $this->volume()->id;
        $this->doTestApiRoute('GET', '/api/v1/volumes/'.$id);

        $this->beUser();
        $response = $this->get('/api/v1/volumes/'.$id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get('/api/v1/volumes/'.$id);
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testUpdate()
    {
        $this->doesntExpectJobs(\Biigle\Jobs\ProcessNewImages::class);

        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::timeSeriesId();
        $this->volume()->save();
        $this->doTestApiRoute('PUT', '/api/v1/volumes/'.$id);

        $this->beGuest();
        $response = $this->put('/api/v1/volumes/'.$id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put('/api/v1/volumes/'.$id);
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertNotEquals('the new volume', $this->volume()->fresh()->name);
        $response = $this->json('PUT', '/api/v1/volumes/'.$id, [
            'name' => 'the new volume',
            'media_type_id' => MediaType::locationSeriesId(),
        ]);
        $response->assertStatus(200);
        $this->assertEquals('the new volume', $this->volume()->fresh()->name);
        $this->assertEquals(MediaType::locationSeriesId(), $this->volume()->fresh()->media_type_id);
    }

    public function testUpdateJsonAttrs()
    {
        $volume = $this->volume();
        $id = $volume->id;
        $this->doTestApiRoute('PUT', "/api/v1/volumes/{$id}");

        $this->beAdmin();
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
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('volumes');
        Storage::disk('test')->put('volumes/file.txt', 'abc');

        $this->beAdmin();
        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);
        $response = $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => 'test://volumes',
        ]);
        $response->assertStatus(200);
        $this->assertEquals('test://volumes', $this->volume()->fresh()->url);
    }

    public function testUpdateGlobalAdmin()
    {
        $this->beGlobalAdmin();
        // A request that changes no attributes performed by a global admin triggers
        // a reread.
        $this->expectsJobs(\Biigle\Jobs\ProcessNewImages::class);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id)
            ->assertStatus(200);
    }

    public function testUpdateValidation()
    {
        $id = $this->volume()->id;

        $this->beAdmin();
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
            'url' => '',
        ]);
        // url must not be empty if present
        $response->assertStatus(422);
    }

    public function testUpdateRedirect()
    {
        $this->beAdmin();
        $response = $this->put('/api/v1/volumes/'.$this->volume()->id, [
            '_redirect' => 'settings/profile',
        ]);
        $response->assertRedirect('settings/profile');
        $response->assertSessionHas('saved', false);

        $this->get('/');
        $response = $this->put('/api/v1/volumes/'.$this->volume()->id, [
            'name' => 'abc',
        ]);
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);
    }
}
