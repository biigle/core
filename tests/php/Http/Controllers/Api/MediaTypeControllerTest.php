<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;

class MediaTypeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types');
        $this->assertResponseStatus(401);

        $this->beUser();
        $this->get('/api/v1/media-types');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types/'.MediaType::$timeSeriesId);

        $this->beUser();
        $this->get('/api/v1/media-types/'.MediaType::$timeSeriesId);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('time-series', $content);
    }
}
