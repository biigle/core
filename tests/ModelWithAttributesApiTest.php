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

		// api key authentication
		$this->callToken('GET', $this->endpoint.'/my-test', $this->admin);
		$this->assertResponseOk();

		$this->be($this->admin);
		$r = $this->call('GET', $this->endpoint.'/my-test');
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('"name":"my-test"', $r->getContent());
	}

	// TEST VALIDATION exists:attributes
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
			$this->assertResponseStatus(401);
		}

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
		dd($r->getContent());
	}
}