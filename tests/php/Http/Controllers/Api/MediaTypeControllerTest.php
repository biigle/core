<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;

class MediaTypeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types');

        $this->beUser();
        $response = $this->get('/api/v1/media-types');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types/'.MediaType::imageId());

        $this->beUser();
        $this->getJson('/api/v1/media-types/'.MediaType::imageId())
            ->assertStatus(200)
            ->assertExactJson(MediaType::image()->toArray());
    }
}
