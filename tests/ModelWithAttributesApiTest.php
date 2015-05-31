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

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->callToken('GET', $this->endpoint, $this->user);
			$this->assertResponseStatus(401);
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

		if ($this->model instanceof BelongsToProjectContract)
		{
			$this->callToken('GET', $this->endpoint.'/my-test', $this->user);
			$this->assertResponseStatus(401);
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

	// public function testAttributesShow()
	// {
	// 	$this->model->attributes()->save(AttributeTest::create('my-test'));
		
	// 	$this->doTestApiRoute('GET', $this->endpoint.'/my-test');

	// 	if ($this->model instanceof BelongsToProjectContract)
	// 	{
	// 		$this->callToken('GET', $this->endpoint.'/my-test', $this->user);
	// 		$this->assertResponseStatus(401);
	// 	}

	// 	// api key authentication
	// 	$this->callToken('GET', $this->endpoint.'/my-test', $this->admin);
	// 	$this->assertResponseOk();

	// 	$this->be($this->admin);
	// 	$r = $this->call('GET', $this->endpoint.'/my-test');
	// 	$this->assertStringStartsWith('{', $r->getContent());
	// 	$this->assertStringEndsWith('}', $r->getContent());
	// 	$this->assertContains('"name":"my-test"', $r->getContent());
	// }
}