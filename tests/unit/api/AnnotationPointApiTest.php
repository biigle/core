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
		$this->doTestApiRoute('POST', '/api/v1/annotations/1/points');

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
		// should be the whole annotation object
		$this->assertContains('points', $r->getContent());
		$this->assertContains('labels', $r->getContent());
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
		$this->callAjax('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->guest);
		$this->callAjax('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);
		$this->assertNotNull($point->fresh());

		$this->be($this->editor);
		$this->callAjax('DELETE', '/api/v1/annotations/1/points/'.$id, array(
			'_token' => Session::token()
		));
		$this->assertResponseOk();
		$this->assertNull($point->fresh());
	}
}