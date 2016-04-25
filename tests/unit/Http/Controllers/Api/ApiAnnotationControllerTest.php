<?php

class ApiAnnotationControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = AnnotationTest::create();
        $this->project()->addTransectId($this->annotation->image->transect->id);
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
        $this->doTestApiRoute('GET', "api/v1/annotations/{$id}");

        $this->beEditor();
        $this->get("api/v1/annotations/{$id}");
        $this->assertResponseOk();

        $this->beGuest();
        $this->get("api/v1/annotations/{$id}");
        $this->assertResponseOk();

        $this->beUser();
        $this->get("api/v1/annotations/{$id}");
        $this->assertResponseStatus(401);

        // session cookie authentication
        $this->beAdmin();
        $this->get("api/v1/annotations/{$id}")
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

        $this->doTestApiRoute('PUT', "api/v1/annotations/{$id}");

        $this->beUser();
        $this->put("api/v1/annotations/{$id}");
        $this->assertResponseStatus(401);

        $this->annotation->addPoint(10, 10);
        $points = $this->annotation->points()->get()->toArray();
        $this->assertEquals(10, $points[0]['y']);

        // api key authentication
        $this->beAdmin();
        $this->put("api/v1/annotations/{$id}", [
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
        $this->json('PUT', "api/v1/annotations/{$id}", [
            'points' => '[{"x":10, "y":15}, {"x": 100, "y": 200}]',
        ]);
        // invalid number of points
        $this->assertResponseStatus(422);
    }

    public function testDestroy()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', "api/v1/annotations/{$id}");

        $this->beUser();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(401);

        $this->assertNotNull($this->annotation->fresh());

        $this->beAdmin();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseOk();

        $this->assertNull($this->annotation->fresh());

        $this->annotation = AnnotationTest::create();
        $this->project()->addTransectId($this->annotation->image->transect->id);
        $id = $this->annotation->id;

        $this->beUser();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseOk();

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $this->delete("api/v1/annotations/{$id}", [
            '_token' => Session::token(),
        ]);
        $this->assertResponseStatus(404);
    }
}
