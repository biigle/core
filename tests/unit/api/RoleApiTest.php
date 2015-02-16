<?php

use Dias\Role;

class RoleApiTest extends ApiTestCase {

	public function testIndex()
	{
		$this->call('GET', '/api/v1/roles');
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/roles', $this->user);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/roles');
		$this->assertResponseOk();
		$this->assertStringStartsWith('[', $r->getContent());
		$this->assertStringEndsWith(']', $r->getContent());
	}

	public function testShow()
	{
		$this->call('GET', '/api/v1/roles/'.Role::adminId());
		$this->assertResponseStatus(401);

		// api key authentication
		$this->callToken('GET', '/api/v1/roles/'.Role::adminId(), $this->user);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->user);
		$r = $this->callAjax('GET', '/api/v1/roles/'.Role::adminId());
		$this->assertResponseOk();
		$this->assertStringStartsWith('{', $r->getContent());
		$this->assertStringEndsWith('}', $r->getContent());
		$this->assertContains('admin', $r->getContent());
	}
}