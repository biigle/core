<?php

use Dias\Contracts\BelongsToProjectContract;

abstract class ModelWithAttributesApiTest extends ApiTestCase {

	private $model;

	private $endpoint;

	abstract protected function getEndpoint();

	abstract protected function getModel();

	public function setUp()
	{
		parent::setUp();
		$this->model = $this->getModel();
		$this->model->save();
		$this->endpoint = $this->getEndpoint().'/'.$this->model->id.'/attributes';
		$this->model->attributes()->save(AttributeTest::create());
	}

	public function testAttributesIndex()
	{
		// $attr = AttributeTest::create();
		// $this->model->attributes()->save($attr);
		$this->doTestApiRoute('GET', $this->endpoint);

		$this->callToken('GET', $this->endpoint, $this->user);

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->assertResponseStatus(401);
		}
		else
		{
			$this->assertResponseOk();
		}

		// api key authentication
		$this->callToken('GET', $this->endpoint, $this->admin);
		$this->assertResponseOk();

		$this->be($this->admin);
		$r = $this->call('GET', $this->endpoint);
		$this->assertStringStartsWith('[{', $r->getContent());
		$this->assertStringEndsWith('}]', $r->getContent());
		$this->assertContains('"name"', $r->getContent());
		$this->assertContains('"type"', $r->getContent());
		$this->assertContains('"value_int"', $r->getContent());
		$this->assertContains('"value_double"', $r->getContent());
		$this->assertContains('"value_string"', $r->getContent());
	}

	public function testAttributesShow()
	{
		$this->model->attributes()->save(AttributeTest::create('my-test'));
		
		$this->doTestApiRoute('GET', $this->endpoint.'/my-test');

		$this->callToken('GET', $this->endpoint.'/my-test', $this->user);

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->assertResponseStatus(401);
		}
		else
		{
			$this->assertResponseOk();
		}

		$this->callToken('GET', $this->endpoint.'/my-test123', $this->admin);
		$this->assertResponseStatus(404);

		// api key authentication
		$this->callToken('GET', $this->endpoint.'/my-test', $this->admin);
		$this->assertResponseOk();

		$this->be($this->admin);
		$r = $this->call('GET', $this->endpoint.'/my-test');
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"my-test"', $r->getContent());
	}

	public function testAttributesStore()
	{	
		$attr = AttributeTest::create('my-test');
		$attr->save();
		$attr2 = AttributeTest::create('my-test2');
		$attr2->save();

		$this->doTestApiRoute('POST', $this->endpoint);

		$this->callToken('POST', $this->endpoint, $this->guest);
		// missing arguments
		$this->assertResponseStatus(422);

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->callToken('POST', $this->endpoint, $this->guest, array(
				'name'  => 'my-test',
				'value' => 123
			));
			// guest is not allowed to edit the attributes
			$this->assertResponseStatus(401);
		}

		if ($this->model instanceof Dias\Project)
		{
			$this->callToken('POST', $this->endpoint, $this->editor, array(
				'name'  => 'my-test',
				'value' => 123
			));
			// editor is not allowed to edit the attributes of a project
			$this->assertResponseStatus(401);
		}

		$this->callToken('POST', $this->endpoint, $this->editor, array(
			'name'  => 'my-test123',
			'value' => 123
		));
		// does not exist
		$this->assertResponseStatus(422);

		// api key authentication
		$this->assertEquals(1, $this->model->attributes()->count());
		$this->callToken('POST', $this->endpoint, $this->editor, array(
			'name'  => 'my-test',
			'value' => 123
		));
		$this->assertResponseStatus(201);
		$this->assertEquals(2, $this->model->attributes()->count());

		$this->be($this->admin);
		$this->call('POST', $this->endpoint, array(
			'_token' => Session::token(),
			'name'  => 'my-test',
			'value' => 123
		));
		// the same attribute can only be attached once
		$this->assertResponseStatus(400);

		$r = $this->call('POST', $this->endpoint, array(
			'_token' => Session::token(),
			'name'  => 'my-test2',
			'value' => 123
		));
		$this->assertResponseStatus(201);
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"my-test2"', $r->getContent());
	}

	public function testAttributesUpdate()
	{
		$attr = AttributeTest::create('my-test');
		$attr->save();
		$this->model->attachDiasAttribute('my-test', 123);

		$this->doTestApiRoute('PUT', $this->endpoint.'/my-test');

		$this->callToken('PUT', $this->endpoint.'/my-test', $this->guest);
		// missing arguments
		$this->assertResponseStatus(422);

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->callToken('PUT', $this->endpoint.'/my-test', $this->guest, array(
				'value' => 321
			));
			// guest is not allowed to edit the attributes
			$this->assertResponseStatus(401);
		}

		if ($this->model instanceof Dias\Project)
		{
			$this->callToken('PUT', $this->endpoint.'/my-test', $this->editor, array(
				'value' => 321
			));
			// editor is not allowed to edit the attributes of a project
			$this->assertResponseStatus(401);
		}

		$this->callToken('PUT', $this->endpoint.'/my-test123', $this->admin, array(
			'value' => 321,
		));
		// model does not have this attribute
		$this->assertResponseStatus(404);

		// api key authentication
		$this->assertEquals(
			123,
			$this->model->attributes()->whereName('my-test')->first()->value_int
		);

		$this->callToken('PUT', $this->endpoint.'/my-test', $this->admin, array(
			'value' => 321
		));
		$this->assertResponseOk();

		$this->assertEquals(
			321,
			$this->model->attributes()->whereName('my-test')->first()->value_int
		);

		$this->be($this->admin);

		$this->call('PUT', $this->endpoint.'/my-test', array(
			'_token' => Session::token(),
			'name'  => 'my-test2',
			'value' => 987
		));
		$this->assertResponseOk();
	}

	public function testAttributesDestroy()
	{
		$attr = AttributeTest::create('my-test');
		$attr->save();
		$this->model->attachDiasAttribute('my-test', 123);

		$this->doTestApiRoute('DELETE', $this->endpoint.'/my-test');

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->callToken('DELETE', $this->endpoint.'/my-test', $this->guest);
			// guest is not allowed to detach the attributes
			$this->assertResponseStatus(401);
		}

		if ($this->model instanceof Dias\Project)
		{
			$this->callToken('DELETE', $this->endpoint.'/my-test', $this->editor);
			// editor is not allowed to detach the attributes of a project
			$this->assertResponseStatus(401);
		}

		$count = $this->model->attributes()->count();
		$this->callToken('DELETE', $this->endpoint.'/my-test', $this->admin);
		$this->assertEquals($count - 1, $this->model->attributes()->count());
	}
}