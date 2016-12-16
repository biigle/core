<?php

namespace Dias\Tests\Http\Controllers\Api;

use ApiTestCase;
use Dias\Visibility;

class VisibilityControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/visibilities');

        $this->beUser();
        $this->get('/api/v1/visibilities');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/visibilities/'.Visibility::$public->id);

        $this->beUser();
        $this->get('/api/v1/visibilities/'.Visibility::$public->id);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('public', $content);
    }
}
