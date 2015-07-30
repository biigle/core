<?php

class ApiAnnotationControllerTest extends ModelWithAttributesApiTest
{
    protected function getEndpoint()
    {
        return '/api/v1/annotations';
    }

    protected function getModel()
    {
        $annotation = AnnotationTest::create();
        $this->project->addTransectId($annotation->image->transect->id);
        return $annotation;
    }

    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = $this->getModel();
    }

    public function testShow()
    {
        $id = $this->annotation->id;
        $this->doTestApiRoute('GET', $this->getEndpoint().'/'.$id);

        // api key authentication
        $this->callToken('GET', $this->getEndpoint().'/'.$id, $this->admin);
        $this->assertResponseOk();

        // permissions
        $this->callToken('GET', $this->getEndpoint().'/'.$id, $this->editor);
        $this->assertResponseOk();

        $this->callToken('GET', $this->getEndpoint().'/'.$id, $this->guest);
        $this->assertResponseOk();

        $this->callToken('GET', $this->getEndpoint().'/'.$id, $this->user);
        $this->assertResponseStatus(401);

        // session cookie authentication
        $this->be($this->admin);
        $r = $this->call('GET', $this->getEndpoint().'/'.$id);

        $this->assertResponseOk();
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertContains('points":[', $r->getContent());
        // the labels should be fetched separately
        $this->assertNotContains('labels', $r->getContent());
        // image and transect objects from projectIds() call shouldn't be
        // included in the output
        $this->assertNotContains('"image"', $r->getContent());
        $this->assertNotContains('transect', $r->getContent());
    }

    public function testUpdate()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('PUT', $this->getEndpoint().'/'.$id);

        $this->callToken('PUT', $this->getEndpoint().'/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->annotation->addPoint(10, 10);
        $points = $this->annotation->points()->get()->toArray();
        $this->assertEquals(10, $points[0]['y']);

        // api key authentication
        $this->callToken('PUT', $this->getEndpoint().'/'.$id, $this->admin, [
            'points' => '[{"x":10, "y":15}, {"x": 100, "y": 200}]',
        ]);
        $this->assertResponseOk();

        $this->assertEquals(2, $this->annotation->points()->count());
        $points = $this->annotation->points()->get()->toArray();
        $this->assertEquals(15, $points[0]['y']);
    }

    public function testDestroy()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', $this->getEndpoint().'/'.$id);

        $this->callToken('DELETE', $this->getEndpoint().'/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->assertNotNull($this->annotation->fresh());

        // api key authentication
        $this->callToken('DELETE', $this->getEndpoint().'/'.$id, $this->admin);
        $this->assertResponseOk();

        $this->assertNull($this->annotation->fresh());

        $this->annotation = AnnotationTest::create();
        $this->project->addTransectId($this->annotation->image->transect->id);
        $id = $this->annotation->id;

        // permissions
        $this->callToken('DELETE', $this->getEndpoint().'/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', $this->getEndpoint().'/'.$id, $this->guest);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', $this->getEndpoint().'/'.$id, $this->editor);
        $this->assertResponseOk();

        // session cookie authentication

        // admin could delete but the annotation was already deleted
        $this->be($this->admin);
        $this->call('DELETE', $this->getEndpoint().'/'.$id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(404);
    }
}
