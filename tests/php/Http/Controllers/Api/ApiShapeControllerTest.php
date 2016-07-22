<?php

use Dias\Shape;

class ApiShapeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/shapes');

        $this->beUser();
        $this->get('/api/v1/shapes');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/shapes/'.Shape::$circleId);

        $this->beUser();
        $this->get('/api/v1/shapes/'.Shape::$circleId);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('Circle', $content);
    }
}
