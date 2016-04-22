<?php

use Dias\Label;

class ApiProjectLabelControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', "/api/v1/projects/{$this->project()->id}/labels/");

        // api key authentication
        $this->callToken('GET', "/api/v1/projects/{$this->project()->id}/labels/", $this->user());
        $this->assertResponseStatus(401);

        $this->callToken('GET', "/api/v1/projects/{$this->project()->id}/labels/", $this->guest());
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest());
        $r = $this->call('GET', "/api/v1/projects/{$this->project()->id}/labels/");
        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
    }
}
