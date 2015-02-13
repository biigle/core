<?php

use Dias\Role;

class AnnotationApiTest extends ApiTestCase {

	private $anotation;

	public function setUp()
	{
		parent::setUp();
		$this->annotation = AnnotationTest::create();
		$this->annotation->save();
		$this->project->addTransectId($this->annotation->image->transect->id);
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/annotations/1');
		$this->assertResponseStatus(401);

		// api key authentication
		$this->call('GET', '/api/v1/annotations/1', [], [], [], $this->adminCredentials);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->admin);
		$r = $this->call('GET', '/api/v1/annotations/1');
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());

		// permissions
		$this->be($this->editor);
		$this->call('GET', '/api/v1/annotations/1');
		$this->assertResponseOk();

		$this->be($this->guest);
		$this->call('GET', '/api/v1/annotations/1');
		$this->assertResponseOk();

		$this->be($this->user);
		$this->call('GET', '/api/v1/annotations/1');
		$this->assertResponseStatus(401);
	}

	public function testUpdate()
	{

	}

	public function testDestroy()
	{

	}
}