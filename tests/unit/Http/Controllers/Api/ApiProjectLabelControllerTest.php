<?php

use Dias\Label;

class ApiProjectLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', "/api/v1/projects/{$this->project()->id}/labels/");

        $this->beUser();
        $this->get("/api/v1/projects/{$this->project()->id}/labels/");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("/api/v1/projects/{$this->project()->id}/labels/");
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }
}
