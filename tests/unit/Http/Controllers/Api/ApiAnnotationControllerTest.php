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
        $this->project()->addTransectId($annotation->image->transect->id);

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
        // test ordering of points, too
        // use fresh() so numbers get strings in SQLite and stay numbers in Postgres
        $point1 = AnnotationPointTest::create([
            'annotation_id' => $id,
            'index' => 1,
        ])->fresh();
        $point2 = AnnotationPointTest::create([
            'annotation_id' => $id,
            'index' => 0,
        ])->fresh();
        $this->doTestApiRoute('GET', $this->getEndpoint().'/'.$id);

        $this->beEditor();
        $this->get($this->getEndpoint().'/'.$id);
        $this->assertResponseOk();

        $this->beGuest();
        $this->get($this->getEndpoint().'/'.$id);
        $this->assertResponseOk();

        $this->beUser();
        $this->get($this->getEndpoint().'/'.$id);
        $this->assertResponseStatus(401);

        // session cookie authentication
        $this->beAdmin();
        $this->get($this->getEndpoint().'/'.$id)
            ->seeJson([
                'points' => [
                    ['x' => $point2->x, 'y' => $point2->y],
                    ['x' => $point1->x, 'y' => $point1->y],
                ],
            ]);
        // the labels should be fetched separately
        $this->assertNotContains('labels', $this->response->getContent());
        // image and transect objects from projectIds() call shouldn't be
        // included in the output
        $this->assertNotContains('"image"', $this->response->getContent());
        $this->assertNotContains('transect', $this->response->getContent());
    }

    public function testUpdate()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('PUT', $this->getEndpoint().'/'.$id);

        $this->beUser();
        $this->put($this->getEndpoint().'/'.$id);
        $this->assertResponseStatus(401);

        $this->annotation->addPoint(10, 10);
        $points = $this->annotation->points()->get()->toArray();
        $this->assertEquals(10, $points[0]['y']);

        // api key authentication
        $this->beAdmin();
        $this->put($this->getEndpoint().'/'.$id, [
            'points' => '[{"x":10, "y":15}, {"x": 100, "y": 200}]',
        ]);
        $this->assertResponseOk();

        $this->assertEquals(2, $this->annotation->unorderedPoints()->count());
        $points = $this->annotation->points()->get()->toArray();
        $this->assertEquals(15, $points[0]['y']);
    }

    public function testUpdateValidatePoints()
    {
        $id = $this->annotation->id;
        $this->annotation->shape_id = Dias\Shape::$pointId;
        $this->annotation->save();

        $this->beAdmin();
        $this->json('PUT', $this->getEndpoint().'/'.$id, [
            'points' => '[{"x":10, "y":15}, {"x": 100, "y": 200}]',
        ]);
        // invalid number of points
        $this->assertResponseStatus(422);
    }

    public function testDestroy()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', $this->getEndpoint().'/'.$id);

        $this->beUser();
        $this->delete($this->getEndpoint().'/'.$id);
        $this->assertResponseStatus(401);

        $this->assertNotNull($this->annotation->fresh());

        $this->beAdmin();
        $this->delete($this->getEndpoint().'/'.$id);
        $this->assertResponseOk();

        $this->assertNull($this->annotation->fresh());

        $this->annotation = AnnotationTest::create();
        $this->project()->addTransectId($this->annotation->image->transect->id);
        $id = $this->annotation->id;

        $this->beUser();
        $this->delete($this->getEndpoint().'/'.$id);
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->delete($this->getEndpoint().'/'.$id);
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->delete($this->getEndpoint().'/'.$id);
        $this->assertResponseOk();

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $this->delete($this->getEndpoint().'/'.$id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(404);
    }
}
