<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Visibility;

class VisibilityControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/visibilities');

        $this->beUser();
        $response = $this->get('/api/v1/visibilities');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/visibilities/'.Visibility::publicId());

        $this->beUser();
        $response = $this->get('/api/v1/visibilities/'.Visibility::publicId());
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertStringContainsString('public', $content);
    }
}
