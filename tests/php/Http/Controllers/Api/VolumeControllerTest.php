<?php

namespace Biigle\Tests\Http\Controllers\Api;

use File;
use ApiTestCase;
use Biigle\MediaType;

class VolumeControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->volume()->id;
        $this->doTestApiRoute('GET', '/api/v1/volumes/'.$id);

        $this->beUser();
        $this->get('/api/v1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/volumes/'.$id);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testUpdate()
    {
        $this->doesntExpectJobs(\Biigle\Jobs\GenerateThumbnails::class);

        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::$timeSeriesId;
        $this->volume()->save();
        $this->doTestApiRoute('PUT', '/api/v1/volumes/'.$id);

        $this->beGuest();
        $this->put('/api/v1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->put('/api/v1/volumes/'.$id);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->assertNotEquals('the new volume', $this->volume()->fresh()->name);
        $this->json('PUT', '/api/v1/volumes/'.$id, [
            'name' => 'the new volume',
            'media_type_id' => MediaType::$locationSeriesId,
        ]);
        $this->assertResponseOk();
        $this->assertEquals('the new volume', $this->volume()->fresh()->name);
        $this->assertEquals(MediaType::$locationSeriesId, $this->volume()->fresh()->media_type_id);
    }

    public function testUpdateUrl()
    {
        // URL validation
        File::shouldReceive('exists')->once()->andReturn(true);
        File::shouldReceive('isReadable')->once()->andReturn(true);

        $this->beAdmin();
        $this->expectsJobs(\Biigle\Jobs\GenerateThumbnails::class);
        $this->json('PUT', '/api/v1/volumes/'.$this->volume()->id, [
            'url' => '/new/url',
        ]);
        $this->assertResponseOk();
        $this->assertEquals('/new/url', $this->volume()->fresh()->url);
    }

    public function testUpdateValidation()
    {
        $id = $this->volume()->id;

        $this->beAdmin();
        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'media_type_id' => '',
        ]);
        // media type id must not be empty if present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'media_type_id' => 999,
        ]);
        // media type id does not exist
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/volumes/{$id}", [
            'url' => '',
        ]);
        // url must not be empty if present
        $this->assertResponseStatus(422);
    }

    public function testUpdateRedirect()
    {
        $this->beAdmin();
        $this->put('/api/v1/volumes/'.$this->volume()->id, [
            '_redirect' => 'settings/profile',
        ]);
        $this->assertRedirectedTo('settings/profile');
        $this->assertSessionHas('saved', false);

        $this->visit('/');
        $this->put('/api/v1/volumes/'.$this->volume()->id, [
            'name' => 'abc',
        ]);
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);
    }
}
