<?php

use Dias\Role;

class ApiRoleControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/roles');

// api key authentication
        $this->callToken('GET', '/api/v1/roles', $this->user());
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user());
        $r = $this->call('GET', '/api/v1/roles');
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/roles/'.Role::$admin->id);

        // api key authentication
        $this->callToken('GET', '/api/v1/roles/'.Role::$admin->id, $this->user());
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user());
        $r = $this->call('GET', '/api/v1/roles/'.Role::$admin->id);
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertContains('admin', $r->getContent());
    }
}
