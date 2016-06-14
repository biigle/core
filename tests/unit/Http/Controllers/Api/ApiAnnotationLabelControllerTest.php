<?php

class ApiAnnotationLabelControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = AnnotationTest::create();
        $this->project()->addTransectId($this->annotation->image->transect->id);
        $this->project()->labelTrees()->attach($this->labelRoot()->label_tree_id);
    }

    public function testIndex()
    {
        AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $this->doTestApiRoute('GET', '/api/v1/annotations/1/labels');

        // api key authentication
        $this->beUser();
        $this->get('/api/v1/annotations/1/labels');
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get('/api/v1/annotations/1/labels');
        $this->assertResponseOk();

        $this->beGuest();
        $this->get('/api/v1/annotations/1/labels');

        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
    }

    public function testStore()
    {
        $id = $this->annotation->id;
        $this->doTestApiRoute('POST', "/api/v1/annotations/{$id}/labels");

        // missing arguments
        $this->beEditor();
        $this->json('POST', "/api/v1/annotations/{$id}/labels");
        $this->assertResponseStatus(422);

        $this->assertEquals(0, $this->annotation->labels()->count());

        $this->beUser();
        $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1
        ]);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1
        ]);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1
        ]);
        $this->assertResponseStatus(201);
        $this->assertEquals(1, $this->annotation->labels()->count());

        $this->beAdmin();
        $this->json('POST', "/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1
        ]);
        $this->assertResponseStatus(201);
        $this->assertEquals(2, $this->annotation->labels()->count());
        $this->seeJson([
            'id' => $this->labelRoot()->id,
            'name' => $this->labelRoot()->name,
            'parent_id' => $this->labelRoot()->parent_id,
            'color' => $this->labelRoot()->color,
        ]);
        $this->seeJson([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
        $this->seeJson(['confidence' => 0.1]);

        $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        // the same user cannot attach the same label twice
        $this->assertResponseStatus(400);
        $this->assertEquals(2, $this->annotation->labels()->count());
    }

    public function testUpdate()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
            'confidence' => 0.5,
        ]);
        $id = $annotationLabel->id;

        $this->doTestApiRoute('PUT', '/api/v1/annotation-labels/'.$id);

        $this->beUser();
        $this->put('/api/v1/annotation-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->put('/api/v1/annotation-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->put('/api/v1/annotation-labels/'.$id);
        $this->assertResponseOk();

        $this->beAdmin();
        $this->put('/api/v1/annotation-labels/'.$id);
        $this->assertResponseOk();

        $this->assertEquals(0.5, $annotationLabel->fresh()->confidence);
        $this->beEditor();
        $this->put('/api/v1/annotation-labels/'.$id, [
            '_token' => Session::token(),
            'confidence' => 0.1,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(0.1, $annotationLabel->fresh()->confidence);
    }

    public function testDestroy()
    {
        $id = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', '/api/v1/annotation-labels/'.$id);

        $this->beUser();
        $this->delete('/api/v1/annotation-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete('/api/v1/annotation-labels/'.$id);
        $this->assertResponseStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());
        $this->beEditor();
        $this->delete('/api/v1/annotation-labels/'.$id);
        $this->assertResponseOk();
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $this->delete('/api/v1/annotation-labels/'.$id2);
        // not the own label
        $this->assertResponseStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id2)->exists());

        $id = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $this->delete('/api/v1/annotation-labels/'.$id);
        $this->assertResponseOk();
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $this->delete('/api/v1/annotation-labels/'.$id2);
        $this->assertResponseOk();
        $this->assertFalse($this->annotation->labels()->exists());
    }
}
