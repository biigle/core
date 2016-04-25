<?php

class ApiTransectControllerTest extends ApiTestCase
{

    private $transect;

    public function setUp()
    {
        parent::setUp();
        $this->transect = TransectTest::create();
        $this->project()->addTransectId($this->transect->id);
    }

    public function testShow()
    {
        $id = $this->transect->id;
        $this->doTestApiRoute('GET', '/api/v1/transects/'.$id);

        $this->beUser();
        $this->get('/api/v1/transects/'.$id);
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get('/api/v1/transects/'.$id);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testUpdate()
    {
        $id = $this->transect->id;
        $this->doTestApiRoute('PUT', '/api/v1/transects/'.$id);

        $this->beGuest();
        $this->put('/api/v1/transects/'.$id);
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->put('/api/v1/transects/'.$id);
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->assertNotEquals('the new transect', $this->transect->fresh()->name);
        $this->put('/api/v1/transects/'.$id, [
            'name' => 'the new transect',
        ]);
        $this->assertResponseOk();
        $this->assertEquals('the new transect', $this->transect->fresh()->name);
    }
}
