<?php

use Dias\MediaType;

class MediaTypeApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/media-types');
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/media-types', $this->admin);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/media-types');
		$this->assertResponseOk();
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/media-types/'.MediaType::timeSeriesId());
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/media-types/'.MediaType::timeSeriesId(), $this->admin);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/media-types/'.MediaType::timeSeriesId());
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('time-series', $r->getContent());
	}
}