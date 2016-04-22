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

        $this->beUser();
        $this->get('/api/v1/transects/'.$id.'/images');
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get('/api/v1/transects/'.$id.'/images');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }
}
