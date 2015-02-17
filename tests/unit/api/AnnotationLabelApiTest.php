<?php

class AnnotationLabelApiTest extends ApiTestCase {

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
		$this->call('POST', '/api/v1/annotations/1/labels');
		$this->assertResponseStatus(403);

		$this->call('POST', '/api/v1/annotations/1/labels', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		// missing arguments
		$this->callToken('POST', '/api/v1/annotations/1/labels', $this->editor);
		$this->assertResponseStatus(400);

		$this->assertEquals(0, $this->annotation->labels()->count());

		$this->callToken('POST', '/api/v1/annotations/1/labels', $this->user, array('label_id' => 1, 'confidence' => 0.1)
		);
		$this->assertResponseStatus(401);

		$this->callToken('POST', '/api/v1/annotations/1/labels', $this->guest, array('label_id' => 1, 'confidence' => 0.1)
		);
		$this->assertResponseStatus(401);

		$this->callToken('POST', '/api/v1/annotations/1/labels', $this->editor, array('label_id' => 1, 'confidence' => 0.1)
		);
		$this->assertResponseStatus(201);
		$this->assertEquals(1, $this->annotation->labels()->count());

		$this->callToken('POST', '/api/v1/annotations/1/labels', $this->admin, array('label_id' => 1, 'confidence' => 0.1)
		);
		$this->assertResponseStatus(201);
		$this->assertEquals(2, $this->annotation->labels()->count());

		// session cookie authentication
		$this->be($this->admin);
		$this->callAjax('POST', '/api/v1/annotations/1/labels', array(
			'_token' => Session::token(),
			'label_id' => 1,
			'confidence' => 0.1
		));
		// the same user cannot attach the same label twice
		$this->assertResponseStatus(400);
		$this->assertEquals(2, $this->annotation->labels()->count());
	}

	public function testUpdate()
	{
		$this->annotation->addLabel(1, 0.5, $this->editor);

		// token mismatch
		$this->call('PUT', '/api/v1/annotations/1/labels/1');
		$this->assertResponseStatus(403);

		$this->call('PUT', '/api/v1/annotations/1/labels/1', array(
			'_token' => Session::token()
		));
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('PUT', '/api/v1/annotations/1/labels/1', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/annotations/1/labels/1', $this->guest);
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/annotations/1/labels/1', $this->editor);
		$this->assertResponseOk();

		$this->callToken('PUT', '/api/v1/annotations/1/labels/1', $this->admin);
		// admin didn't attach any label
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->assertEquals(0.5, $this->annotation->labels()->first()->confidence);
		$this->be($this->editor);
		$this->callAjax('PUT', '/api/v1/annotations/1/labels/1', array(
			'_token' => Session::token(),
			'confidence' => 0.1
		));
		$this->assertResponseOk();
		$this->assertEquals(0.1, $this->annotation->labels()->first()->confidence);
	}
}