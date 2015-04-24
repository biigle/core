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
		$this->doTestApiRoute('GET', '/api/v1/annotations/1');

		// api key authentication
		$this->callToken('GET', '/api/v1/annotations/1', $this->admin);
		$this->assertResponseOk();

		// permissions
		$this->callToken('GET', '/api/v1/annotations/1', $this->editor);
		$this->assertResponseOk();

		$this->callToken('GET', '/api/v1/annotations/1', $this->guest);
		$this->assertResponseOk();

		$this->callToken('GET', '/api/v1/annotations/1', $this->user);
		$this->assertResponseStatus(401);

		// session cookie authentication
		$this->be($this->admin);
		$r = $this->call('GET', '/api/v1/annotations/1');

		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('points":[', $r->getContent());
		// the labels should be fetched separately
		$this->assertNotContains('labels', $r->getContent());
		// image and transect objects from projectIds() call shouldn't be
		// included in the output
		$this->assertNotContains('"image"', $r->getContent());
		$this->assertNotContains('transect', $r->getContent());
	}

	public function testUpdate()
	{
		$this->doTestApiRoute('PUT', '/api/v1/annotations/1');

		$this->callToken('PUT', '/api/v1/annotations/1', $this->user);
		$this->assertResponseStatus(401);

		$this->annotation->addPoint(10, 10);
		$points = $this->annotation->points()->get()->toArray();
		$this->assertEquals(10, $points[0]['y']);

		// api key authentication
		$this->callToken('PUT', '/api/v1/annotations/1', $this->admin, array(
			'points' => '[{"x":10, "y":15}, {"x": 100, "y": 200}]'
		));
		$this->assertResponseOk();

		$this->assertEquals(2, $this->annotation->points()->count());
		$points = $this->annotation->points()->get()->toArray();
		$this->assertEquals(15, $points[0]['y']);
	}

	public function testDestroy()
	{
		$this->doTestApiRoute('DELETE', '/api/v1/annotations/1');

		$this->callToken('DELETE', '/api/v1/annotations/1', $this->user);
		$this->assertResponseStatus(401);

		$this->assertNotNull($this->annotation->fresh());

		// api key authentication
		$this->callToken('DELETE', '/api/v1/annotations/1', $this->admin);
		$this->assertResponseOk();

		$this->assertNull($this->annotation->fresh());

		$this->annotation = AnnotationTest::create();
		$this->annotation->save();
		$this->project->addTransectId($this->annotation->image->transect->id);

		// permissions
		$this->callToken('DELETE', '/api/v1/annotations/2', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('DELETE', '/api/v1/annotations/2', $this->guest);
		$this->assertResponseStatus(401);

		$this->callToken('DELETE', '/api/v1/annotations/2', $this->editor);
		$this->assertResponseOk();

		// session cookie authentication

		// admin could delete but the annotation was already deleted
		$this->be($this->admin);
		$this->call('DELETE', '/api/v1/annotations/2', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(404);
	}
}