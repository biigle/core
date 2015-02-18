<?php

use Dias\Shape;

class ShapeApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->doTestApiRoute('GET', '/api/v1/shapes');

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
		$this->doTestApiRoute('GET', '/api/v1/shapes/'.Shape::circleId());

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