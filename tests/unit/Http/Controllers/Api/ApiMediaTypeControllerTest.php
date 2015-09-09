<?php

use Dias\MediaType;

class ApiMediaTypeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types');
        $this->assertResponseStatus(401);

        // api key authentication
        $this->callToken('GET', '/api/v1/media-types', $this->admin);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user);
        $r = $this->call('GET', '/api/v1/media-types');
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/media-types/'.MediaType::$timeSeriesId);

        // api key authentication
        $this->callToken('GET', '/api/v1/media-types/'.MediaType::$timeSeriesId, $this->admin);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user);
        $r = $this->call('GET', '/api/v1/media-types/'.MediaType::$timeSeriesId);
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertContains('time-series', $r->getContent());
    }
}
