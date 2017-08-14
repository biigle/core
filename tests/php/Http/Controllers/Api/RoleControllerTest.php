<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;

class RoleControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/roles');

        $this->beUser();
        $response = $this->get('/api/v1/roles');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/roles/'.Role::$admin->id);

        $this->beUser();
        $response = $this->get('/api/v1/roles/'.Role::$admin->id);
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('admin', $content);
    }
}
