<?php

use Dias\Label;

class LabelApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->doTestApiRoute('GET', '/api/v1/labels/');

		// api key authentication
		$this->callToken('GET', '/api/v1/labels/', $this->user);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/labels');
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$label = LabelTest::create();
		$label->save();
		$this->doTestApiRoute('GET', '/api/v1/labels/'.$label->id);

		// api key authentication
		$this->callToken('GET', '/api/v1/labels/99999', $this->user);
		$this->assertResponseStatus(404);

		$this->callToken('GET', '/api/v1/labels/'.$label->id, $this->user);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/labels/'.$label->id);
		// response should not be an empty array
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST', '/api/v1/labels');

		// api key authentication
		$this->callToken('POST', '/api/v1/labels', $this->admin);
		// only global admins have access
		$this->assertResponseStatus(401);

		$this->callToken('POST', '/api/v1/labels', $this->globalAdmin);
		// missing arguments
		$this->assertResponseStatus(400);

		// session cookie authentication
		$this->be($this->globalAdmin);
		$count = Label::all()->count();
		$this->callAjax('POST', '/api/v1/labels', array(
			'_token' => Session::token(),
			'name' => 'Sea Cucumber',
		));
		$this->assertResponseOk();
		$this->assertEquals($count + 1, Label::all()->count());

		$this->callAjax('POST', '/api/v1/labels', array(
			'_token' => Session::token(),
			'name' => 'Stone',
			'parent_id' => 99999
		));
		// parent label does not exist
		$this->assertResponseStatus(400);

		$r = $this->callAjax('POST', '/api/v1/labels', array(
			'_token' => Session::token(),
			'name' => 'Baby Sea Cucumber',
			'aphia_id' => 1234,
			'parent_id' => 1
		));
		$this->assertResponseOk();
		$this->assertEquals($count + 2, Label::all()->count());
		$label = Label::find(Label::max('id'));
		$this->assertEquals('Baby Sea Cucumber', $label->name);
		$this->assertEquals(1234, $label->aphia_id);
		$this->assertEquals(1, $label->parent->id);

		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertNotContains('"parent":{', $r->getContent());
	}

	public function testUpdate()
	{
		$label = LabelTest::create();
		$label->save();

		$this->doTestApiRoute('PUT', '/api/v1/labels/'.$label->id);

		// api key authentication
		$this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->admin);
		// only global admins have access
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->globalAdmin);
		$this->assertResponseOk();

		$this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->globalAdmin, array('parent_id' => 9999));
		// parent label dos not exist
		$this->assertResponseStatus(400);

		// session cookie authentication
		$this->be($this->globalAdmin);
		$this->assertNotEquals('random name abc', $label->name);
		$this->assertNull($label->parent);
		$this->assertNull($label->aphia_id);

		$this->callAjax('PUT', '/api/v1/labels/'.$label->id, array(
			'_token' => Session::token(),
			'name' => 'random name abc',
			'parent_id' => 1,
			'aphia_id' => 2,
		));

		$this->assertResponseOk();
		$label = $label->fresh();
		$this->assertEquals('random name abc', $label->name);
		$this->assertEquals(1, $label->parent->id);
		$this->assertEquals(2, $label->aphia_id);
	}

	public function testDestroy()
	{
		$label = LabelTest::create();
		$label->save();

		$this->doTestApiRoute('DELETE', '/api/v1/labels/'.$label->id);

		// api key authentication
		$this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->admin);
		// only global admins have access
		$this->assertResponseStatus(401);

		$this->assertNotNull($label->fresh());
		$this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->globalAdmin);
		$this->assertResponseOk();
		$this->assertNull($label->fresh());

		$parent = LabelTest::create();
		$parent->save();
		$label = LabelTest::create();
		$label->parent()->associate($parent);
		$label->save();

		// session cookie authentication
		$this->be($this->globalAdmin);
		$this->callAjax('DELETE', '/api/v1/labels/'.$parent->id, array(
			'_token' => Session::token()
		));
		// deleting a label with children without the 'force' argument fails
		$this->assertResponseStatus(400);

		$this->callAjax('DELETE', '/api/v1/labels/'.$parent->id, array(
			'_token' => Session::token(),
			'force' => 'abcd'
		));
		$this->assertResponseOk();
		$this->assertNull($parent->fresh());
		$this->assertNull($label->fresh());
	}
}