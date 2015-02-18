<?php

use Dias\Image;

class ImageApiTest extends ApiTestCase {

	private $image;

	public function setUp()
	{
		parent::setUp();
		$this->image = ImageTest::create();
		$this->image->save();
		$this->project->addTransectId($this->image->transect->id);
	}

	public function testShow()
	{
		$this->doTestApiRoute('GET', '/api/v1/images/1');

		// api key authentication
		$this->callToken('GET', '/api/v1/images/1', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/images/a', $this->guest);
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->be($this->guest);
		$r = $this->callAjax('GET', '/api/v1/images/1');
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertNotContains('"transect"', $r->getContent());
	}

	public function testShowThumb()
	{
		$this->doTestApiRoute('GET', '/api/v1/images/1/thumb');

		// api key authentication
		$this->callToken('GET', '/api/v1/images/1/thumb', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/images/a/thumb', $this->guest);
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->be($this->guest);
		$r = $this->callAjax('GET', '/api/v1/images/1/thumb');
		$this->assertResponseOk();
		$this->assertEquals('image/jpeg', $r->headers->get('content-type'));
	}

	public function testShowFile()
	{
		$this->doTestApiRoute('GET', '/api/v1/images/1/file');

		// api key authentication
		$this->callToken('GET', '/api/v1/images/1/file', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/images/a/file', $this->guest);
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->be($this->guest);
		$r = $this->callAjax('GET', '/api/v1/images/1/file');
		$this->assertResponseOk();
		$this->assertEquals('image/jpeg', $r->headers->get('content-type'));
	}
}