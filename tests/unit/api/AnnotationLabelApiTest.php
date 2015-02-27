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

	public function testIndex()
	{
		$label = LabelTest::create();
		$label->save();
		$this->annotation->addLabel($label->id, 0.5, $this->editor);
		$this->doTestApiRoute('GET', '/api/v1/annotations/1/labels');

		// api key authentication
		$this->callToken('GET', '/api/v1/annotations/1/labels', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/annotations/1/labels', $this->guest);
		$this->assertResponseOk();

		$this->be($this->guest);
		$r = $this->callAjax('GET', '/api/v1/annotations/1/labels', array(
			'_token' => Session::token(),
		));

		$this->assertResponseOk();
		$this->assertStringStartsWith('[{', $r->getContent());
		$this->assertStringEndsWith('}]', $r->getContent());
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/annotations/1/labels');

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

		$this->doTestApiRoute('PUT', '/api/v1/annotations/1/labels/1');

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

	public function testDestroy()
	{
		$this->annotation->addLabel(1, 0.5, $this->editor);

		$this->doTestApiRoute('DELETE', '/api/v1/annotations/1/labels/1');

		// api key authentication
		$this->callToken('DELETE', '/api/v1/annotations/1/labels/1', $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('DELETE', '/api/v1/annotations/1/labels/1', $this->guest);
		$this->assertResponseStatus(401);

		$this->assertNotNull($this->annotation->labels()->first());
		$this->callToken('DELETE', '/api/v1/annotations/1/labels/1', $this->editor);
		$this->assertResponseOk();
		$this->assertNull($this->annotation->labels()->first());

		$this->annotation->addLabel(1, 0.5, $this->editor);
		$this->assertNotNull($this->annotation->labels()->first());

		$this->callToken('DELETE', '/api/v1/annotations/1/labels/1', $this->admin);
		// admin doesn't have the label
		$this->assertResponseStatus(404);

		// session cookie authentication
		$this->be($this->admin);
		// admin can detach labels of other users as well if the ID is provided
		$this->callAjax('DELETE', '/api/v1/annotations/1/labels/1', array(
			'_token' => Session::token(),
			'user_id' => $this->editor->id
		));
		$this->assertResponseOk();
		$this->assertNull($this->annotation->labels()->first());
	}
}