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

	public function testIndex()
	{
		$point = $this->annotation->addPoint(10, 20);
		$this->doTestApiRoute('GET', '/api/v1/annotations/1/points');

		// api key authentication
		$this->callToken('GET', '/api/v1/annotations/1/points', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/annotations/1/points', $this->guest);
		$this->assertResponseOk();

		$this->be($this->guest);
		$r = $this->call('GET', '/api/v1/annotations/1/points', array(
			'_token' => Session::token(),
		));

		$this->assertResponseOk();
		$this->assertStringStartsWith('[{', $r->getContent());
		$this->assertStringEndsWith('}]', $r->getContent());
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/annotations/1/points');

		// api key authentication
		// missing arguments
		$this->callToken('POST', '/api/v1/annotations/1/points', $this->admin);
		$this->assertResponseStatus(422);

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
		$r = $this->call('POST', '/api/v1/annotations/1/points', array(
			'_token' => Session::token(),
			'x' => 10,
			'y' => 10,
		));

		$this->assertResponseOk();
		$this->assertEquals(3, $this->annotation->points()->count());

		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testUpdate()
	{
		$point = $this->annotation->addPoint(10, 20);
		$id = $point->id;
		$this->doTestApiRoute('PUT', '/api/v1/annotations/1/points/'.$id);

		// api key authentication
		$this->callToken('PUT', '/api/v1/annotations/1/points/'.$id, $this->guest);
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/annotations/1/points/'.$id, $this->editor, array(
			'x' => 123,
			'y' => 321,
		));
		$this->assertResponseOk();
		$this->assertEquals(123, $point->fresh()->x);
		$this->assertEquals(321, $point->fresh()->y);

		$this->be($this->admin);
		$r = $this->call('PUT', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token(),
			'x' => 1,
			'y' => 2
		));
		$this->assertResponseOk();
		$this->assertEquals(1, $point->fresh()->x);
		$this->assertEquals(2, $point->fresh()->y);
	}

	public function testDestroy()
	{
		$this->doTestApiRoute('DELETE', '/api/v1/annotations/1/points/1');

		// api key authentication
		$this->callToken('DELETE', '/api/v1/annotations/1/points/1', $this->admin);
		$this->assertResponseStatus(404);

		$point = $this->annotation->addPoint(10, 10);
		$id = $point->id;

		$this->callToken('DELETE', '/api/v1/annotations/1/points/'.$id, $this->admin);
		$this->assertResponseOk();
		$this->assertNull($point->fresh());

		$point = $this->annotation->addPoint(10, 10);
		$id = $point->id;
		
		// session cookie authentication
		$this->be($this->user);
		$this->call('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->guest);
		$this->call('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->editor);
		$this->call('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();
		$this->assertNull($point->fresh());
	}
}