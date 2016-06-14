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
        $this->annotation->points = [10, 10, 20, 20];
        $this->annotation->save();
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

        $this->beAdmin();
        $this->get("api/v1/annotations/{$id}")
            ->seeJson(['points' => [10, 10, 20, 20]]);
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

        $this->annotation->points = [10, 10];
        $this->annotation->save();

        $this->beAdmin();
        $this->put("api/v1/annotations/{$id}", ['points' => '[10, 15, 100, 200]']);
        $this->assertResponseOk();

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(4, sizeof($this->annotation->points));
        $this->assertEquals(15, $this->annotation->points[1]);

        $this->json('PUT', "api/v1/annotations/{$id}", ['points' => [20, 25]]);
        $this->assertResponseOk();

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(2, sizeof($this->annotation->points));
        $this->assertEquals(25, $this->annotation->points[1]);
    }

    public function testUpdateValidatePoints()
    {
        $id = $this->annotation->id;
        $this->annotation->shape_id = Dias\Shape::$pointId;
        $this->annotation->save();

        $this->beAdmin();
        $this->json('PUT', "api/v1/annotations/{$id}", ['points' => [10, 15, 100, 200]]);
        // invalid number of points
        $this->assertResponseStatus(422);
    }

    public function testDestroy()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', "api/v1/annotations/{$id}");

        $this->beUser();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(403);

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
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseOk();

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $this->delete("api/v1/annotations/{$id}");
        $this->assertResponseStatus(404);
    }
}
