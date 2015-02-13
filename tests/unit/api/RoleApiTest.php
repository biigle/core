<?php

use Dias\Role;

class RoleApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/roles');
		$this->assertResponseStatus(401);

		// api key authentication
		$this->call('GET', '/api/v1/roles', [], [], [], $this->userCredentials);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->call('GET', '/api/v1/roles');
		$this->assertResponseOk();
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/roles/'.Role::adminId());
		$this->assertResponseStatus(401);

		// api key authentication
		$this->call('GET', '/api/v1/roles/'.Role::adminId(), [], [], [], $this->userCredentials);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->call('GET', '/api/v1/roles/'.Role::adminId());
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('admin', $r->getContent());
	}
}