<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Biigle\Shape;
use ApiTestCase;

class ShapeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/shapes');

        $this->beUser();
        $response = $this->get('/api/v1/shapes');
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/shapes/'.Shape::$circleId);

        $this->beUser();
        $response = $this->get('/api/v1/shapes/'.Shape::$circleId);
        $content = $response->getContent();
        $response->assertStatus(200);
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('Circle', $content);
    }
}
