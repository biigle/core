<?php

class AnnotationApiTest extends ApiTestCase {

	private $annotation;

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
		$this->assertContains('labels', $r->getContent());
		$this->assertContains('points', $r->getContent());
		// image and transect objects from projectIds() call shouldn't be
		// included in the output
		$this->assertNotContains('"image"', $r->getContent());
		$this->assertNotContains('transect', $r->getContent());

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

	public function testDestroy()
	{
		// token mismatch
		$this->call('DELETE', '/api/v1/annotations/1');
		$this->assertResponseStatus(403);

		$this->call('DELETE', '/api/v1/annotations/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		$this->assertNotNull($this->annotation->fresh());

		// api key authentication
		$this->call('DELETE', '/api/v1/annotations/1', array(
			'_token' => Session::token()
		), [], [], $this->adminCredentials);
		$this->assertResponseOk();

		$this->assertNull($this->annotation->fresh());

		$this->annotation = AnnotationTest::create();
		$this->annotation->save();
		$this->project->addTransectId($this->annotation->image->transect->id);

		// session cookie authentication
		// permissions
		$this->be($this->user);
		$this->call('DELETE', '/api/v1/annotations/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		$this->be($this->guest);
		$this->call('DELETE', '/api/v1/annotations/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		$this->be($this->editor);
		$this->call('DELETE', '/api/v1/annotations/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();

		// admin could delete but the annotation was already deleted
		$this->be($this->admin);
		$this->call('DELETE', '/api/v1/annotations/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(404);
	}
}