<?php

class ApiTransectImageControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $transect = TransectTest::create();
        $id = $transect->id;

        $this->project()->addTransectId($id);
        $image = ImageTest::create(['transect_id' => $id]);

        $this->doTestApiRoute('GET', '/api/v1/transects/'.$id.'/images');

        // api key authentication
        $this->callToken('GET', '/api/v1/transects/'.$id.'/images', $this->user());
        $this->assertResponseStatus(401);

        $this->callToken('GET', '/api/v1/transects/'.$id.'/images', $this->guest());
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest());
        $r = $this->call('GET', '/api/v1/transects/'.$id.'/images');
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $r->getContent());
        $this->assertStringEndsWith(']', $r->getContent());
    }
}
