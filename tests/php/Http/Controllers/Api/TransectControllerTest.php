<?php

namespace Dias\Tests\Http\Controllers\Api;

use File;
use Cache;
use ApiTestCase;
use Dias\MediaType;

class TransectControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->transect()->id;
        $this->doTestApiRoute('GET', '/api/v1/transects/'.$id);

        $this->beUser();
        $this->get('/api/v1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/transects/'.$id);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testUpdate()
    {
        $this->doesntExpectJobs(\Dias\Jobs\GenerateThumbnails::class);

        $id = $this->transect()->id;
        $this->transect()->media_type_id = MediaType::$timeSeriesId;
        $this->transect()->save();
        $this->doTestApiRoute('PUT', '/api/v1/transects/'.$id);

        $this->beGuest();
        $this->put('/api/v1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->put('/api/v1/transects/'.$id);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->assertNotEquals('the new transect', $this->transect()->fresh()->name);
        $this->json('PUT', '/api/v1/transects/'.$id, [
            'name' => 'the new transect',
            'media_type_id' => MediaType::$locationSeriesId,
        ]);
        $this->assertResponseOk();
        $this->assertEquals('the new transect', $this->transect()->fresh()->name);
        $this->assertEquals(MediaType::$locationSeriesId, $this->transect()->fresh()->media_type_id);
    }

    public function testUpdateUrl()
    {
        // URL validation
        File::shouldReceive('exists')->once()->andReturn(true);
        File::shouldReceive('isReadable')->once()->andReturn(true);

        $this->beAdmin();
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);
        $this->json('PUT', '/api/v1/transects/'.$this->transect()->id, [
            'url' => '/new/url',
        ]);
        $this->assertResponseOk();
        $this->assertEquals('/new/url', $this->transect()->fresh()->url);
    }

    public function testUpdateValidation()
    {
        $id = $this->transect()->id;

        $this->beAdmin();
        $this->json('PUT', "/api/v1/transects/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/transects/{$id}", [
            'media_type_id' => '',
        ]);
        // media type id must not be empty if present
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/transects/{$id}", [
            'media_type_id' => 999,
        ]);
        // media type id does not exist
        $this->assertResponseStatus(422);

        $this->json('PUT', "/api/v1/transects/{$id}", [
            'url' => '',
        ]);
        // url must not be empty if present
        $this->assertResponseStatus(422);
    }

    public function testUpdateRedirect()
    {
        $this->beAdmin();
        $this->put('/api/v1/transects/'.$this->transect()->id, [
            '_redirect' => 'settings/profile',
        ]);
        $this->assertRedirectedTo('settings/profile');
        $this->assertSessionHas('saved', false);

        $this->visit('/');
        $this->put('/api/v1/transects/'.$this->transect()->id, [
            'name' => 'abc',
        ]);
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);
    }
}
