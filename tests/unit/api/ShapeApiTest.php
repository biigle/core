<?php

use Dias\Shape;

class ShapeApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/shapes');
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/shapes', $this->admin);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/shapes');
		$this->assertResponseOk();
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/shapes/'.Shape::circleId());
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/shapes/'.Shape::circleId(), $this->admin);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/shapes/'.Shape::circleId());
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('circle', $r->getContent());
	}
}