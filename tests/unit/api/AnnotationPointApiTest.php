<?php

class AnnotationPointApiTest extends ApiTestCase {

	private $annotation;

	public function setUp()
	{
		parent::setUp();
		$this->annotation = AnnotationTest::create();
		$this->annotation->save();
		$this->project->addTransectId($this->annotation->image->transect->id);
	}

	public function testStore()
	{
		// token mismatch
		$this->call('POST', '/api/v1/annotations/1/points');
		$this->assertResponseStatus(403);

		$this->call('POST', '/api/v1/annotations/1/points', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		// missing arguments
		$this->callToken('POST', '/api/v1/annotations/1/points', $this->admin);
		$this->assertResponseStatus(400);

		$this->assertEquals(0, $this->annotation->points()->count());

		$this->callToken('POST', '/api/v1/annotations/1/points', $this->admin, array('x' => 10, 'y' => 10)
		);
		$this->assertResponseOk();
		$this->assertEquals(1, $this->annotation->points()->count());

		$this->callToken('POST', '/api/v1/annotations/1/points', $this->user, array('x' => 10, 'y' => 10)
		);
		$this->assertResponseStatus(401);

		$this->callToken('POST', '/api/v1/annotations/1/points', $this->guest, array('x' => 10, 'y' => 10)
		);
		$this->assertResponseStatus(401);

		$this->callToken('POST', '/api/v1/annotations/1/points', $this->editor, array('x' => 10, 'y' => 10)
		);
		$this->assertResponseOk();
		$this->assertEquals(2, $this->annotation->points()->count());

		// session cookie authentication

		$this->be($this->admin);
		$r = $this->callAjax('POST', '/api/v1/annotations/1/points', array(
			'_token' => Session::token(),
			'x' => 10,
			'y' => 10,
		));
		$this->assertResponseOk();
		$this->assertEquals(3, $this->annotation->points()->count());

		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testDestroy()
	{
		$this->call('DELETE', '/api/v1/annotation-points/1');
		$this->assertResponseStatus(403);

		$this->call('DELETE', '/api/v1/annotation-points/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('DELETE', '/api/v1/annotation-points/1', $this->admin);
		$this->assertResponseStatus(404);

		$point = $this->annotation->addPoint(10, 10);

		$this->callToken('DELETE', '/api/v1/annotation-points/'.$point->id, $this->admin);
		$this->assertResponseOk();
		$this->assertNull($point->fresh());

		$point = $this->annotation->addPoint(10, 10);

		// session cookie authentication
		$this->be($this->user);
		$this->callAjax('DELETE', '/api/v1/annotation-points/'.$point->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->guest);
		$this->callAjax('DELETE', '/api/v1/annotation-points/'.$point->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->editor);
		$this->callAjax('DELETE', '/api/v1/annotation-points/'.$point->id, array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();
		$this->assertNull($point->fresh());
	}
}