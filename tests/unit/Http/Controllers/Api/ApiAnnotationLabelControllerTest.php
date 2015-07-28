<?php

class ApiAnnotationLabelControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = AnnotationTest::create();
        $this->annotation->save();
        $this->project->addTransectId($this->annotation->image->transect->id);
    }

    public function testIndex()
    {
        $label = LabelTest::create();
        $label->save();
        $this->annotation->addLabel($label->id, 0.5, $this->editor);
        $this->doTestApiRoute('GET', '/api/v1/annotations/1/labels');

        // api key authentication
        $this->callToken('GET', '/api/v1/annotations/1/labels', $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('GET', '/api/v1/annotations/1/labels', $this->guest);
        $this->assertResponseOk();

        $this->be($this->guest);
        $r = $this->call('GET', '/api/v1/annotations/1/labels', [
            '_token' => Session::token(),
        ]);

        $this->assertResponseOk();
        $this->assertStringStartsWith('[{', $r->getContent());
        $this->assertStringEndsWith('}]', $r->getContent());
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/annotations/1/labels');

        // api key authentication
        // missing arguments
        $this->callToken('POST', '/api/v1/annotations/1/labels', $this->editor);
        $this->assertResponseStatus(422);

        $this->assertEquals(0, $this->annotation->labels()->count());

        $this->callToken('POST', '/api/v1/annotations/1/labels', $this->user, ['label_id' => 1, 'confidence' => 0.1]
        );
        $this->assertResponseStatus(401);

        $this->callToken('POST', '/api/v1/annotations/1/labels', $this->guest, ['label_id' => 1, 'confidence' => 0.1]
        );
        $this->assertResponseStatus(401);

        $this->callToken('POST', '/api/v1/annotations/1/labels', $this->editor, ['label_id' => 1, 'confidence' => 0.1]
        );
        $this->assertResponseStatus(201);
        $this->assertEquals(1, $this->annotation->labels()->count());

        $r = $this->callToken('POST', '/api/v1/annotations/1/labels', $this->admin, ['label_id' => 1, 'confidence' => 0.1]
        );
        $this->assertResponseStatus(201);
        $this->assertEquals(2, $this->annotation->labels()->count());
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());

        // session cookie authentication
        $this->be($this->admin);
        $this->call('POST', '/api/v1/annotations/1/labels', [
            '_token' => Session::token(),
            'label_id' => 1,
            'confidence' => 0.1,
        ]);
        // the same user cannot attach the same label twice
        $this->assertResponseStatus(400);
        $this->assertEquals(2, $this->annotation->labels()->count());
    }

    public function testUpdate()
    {
        $annotationLabel = $this->annotation->addLabel(1, 0.5, $this->editor);
        $id = $annotationLabel->id;

        $this->doTestApiRoute('PUT', '/api/v1/annotation-labels/'.$id);

        // api key authentication
        $this->callToken('PUT', '/api/v1/annotation-labels/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('PUT', '/api/v1/annotation-labels/'.$id, $this->guest);
        $this->assertResponseStatus(401);

        $this->callToken('PUT', '/api/v1/annotation-labels/'.$id, $this->editor);
        $this->assertResponseOk();

        $this->callToken('PUT', '/api/v1/annotation-labels/'.$id, $this->admin);
        $this->assertResponseOk();

        // session cookie authentication
        $this->assertEquals(0.5, $annotationLabel->fresh()->confidence);
        $this->be($this->editor);
        $this->call('PUT', '/api/v1/annotation-labels/'.$id, [
            '_token' => Session::token(),
            'confidence' => 0.1,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(0.1, $annotationLabel->fresh()->confidence);
    }

    public function testDestroy()
    {
        $annotationLabel = $this->annotation->addLabel(1, 0.5, $this->editor);
        $id = $annotationLabel->id;

        $this->doTestApiRoute('DELETE', '/api/v1/annotation-labels/'.$id);

        // api key authentication
        $this->callToken('DELETE', '/api/v1/annotation-labels/'.$id, $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', '/api/v1/annotation-labels/'.$id, $this->guest);
        $this->assertResponseStatus(401);

        $this->assertNotNull($this->annotation->labels()->first());
        $this->callToken('DELETE', '/api/v1/annotation-labels/'.$id, $this->editor);
        $this->assertResponseOk();
        $this->assertNull($this->annotation->labels()->first());

        $annotationLabel = $this->annotation->addLabel(1, 0.5, $this->editor);
        $this->assertNotNull($this->annotation->labels()->first());
        $id = $annotationLabel->id;

        // session cookie authentication
        $this->be($this->admin);
        $this->call('DELETE', '/api/v1/annotation-labels/'.$id, [
            '_token' => Session::token(),
        ]);
        $this->assertResponseOk();
        $this->assertNull($this->annotation->labels()->first());
    }
}
