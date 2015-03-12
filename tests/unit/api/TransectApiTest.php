<?php

class TransectApiTest extends ApiTestCase {

	private $transect;

	public function setUp()
	{
		parent::setUp();

		$this->transect = TransectTest::create();
		$this->transect->save();
		$this->project->addTransectId($this->transect->id);
	}

	public function testShow()
	{
		$id = $this->transect->id;
		$this->doTestApiRoute('GET', '/api/v1/transects/'.$id);

		// api key authentication
		$this->callToken('GET', '/api/v1/transects/'.$id, $this->user);
		$this->assertResponseStatus(401);

		$this->callToken('GET', '/api/v1/transects/'.$id, $this->guest);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->guest);
		$r = $this->call('GET', '/api/v1/transects/'.$id);
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
	}

	public function testUpdate()
	{
		$id = $this->transect->id;
		$this->doTestApiRoute('PUT', '/api/v1/transects/'.$id);

		// api key authentication
		$this->callToken('PUT', '/api/v1/transects/'.$id, $this->guest);
		$this->assertResponseStatus(401);

		$this->callToken('PUT', '/api/v1/transects/'.$id, $this->editor);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->admin);
		$this->assertNotEquals('the new transect', $this->transect->fresh()->name);
		$this->call('PUT', '/api/v1/transects/'.$id, array(
			'_token' => Session::token(),
			'name' => 'the new transect'
		));
		$this->assertResponseOk();
		$this->assertEquals('the new transect', $this->transect->fresh()->name);
	}
}