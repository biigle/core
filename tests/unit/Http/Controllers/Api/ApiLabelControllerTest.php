<?php

use Dias\Label;

class ApiLabelControllerTest extends ApiTestCase
{

    public function testIndex()
    {
        // create a label
        $this->labelRoot();
        $this->doTestApiRoute('GET', '/api/v1/labels/');

        $this->beUser();
        $this->get('/api/v1/labels');
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
    }

    public function testIndexNotProjectLabels()
    {
        // output should not contain project specific labels
        $project = ProjectTest::create();
        $label = LabelTest::create(['project_id' => $project->id, 'name' => 'test123']);

        $this->beUser();
        $this->get('/api/v1/labels');
        $content = $this->response->getContent();
        $this->assertNotContains('test123', $content);
    }

    public function testShow()
    {
        $label = LabelTest::create();
        $this->doTestApiRoute('GET', '/api/v1/labels/'.$label->id);

        $this->beUser();
        $this->get('/api/v1/labels/99999');
        $this->assertResponseStatus(404);

        $this->beUser();
        $this->get('/api/v1/labels/'.$label->id);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        // response should not be an empty array
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testShowNotProjectLabels()
    {
        // output should not contain project specific labels
        $project = ProjectTest::create();
        $label = LabelTest::create(['project_id' => $project->id, 'name' => 'test123']);

        $this->beUser();
        $this->get('/api/v1/labels/'.$label->id);
        $this->assertResponseStatus(404);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/labels');

        $this->beAdmin();
        $this->post('/api/v1/labels', [
            'name' => 'Sea Cucumber',
            'color' => '0099ff',
        ]);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/labels', [
            'name' => 'Sea Cucumber',
        ]);
        // missing color
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/labels', [
            'color' => '0099ff',
        ]);
        // missing name
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/labels', [
            'name' => 'Sea Cucumber',
            'color' => '00wwff',
        ]);
        // malformed color
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/labels', [
            'name' => 'Sea Cucumber',
            'color' => '0099fff',
        ]);
        // still malformed color
        $this->assertResponseStatus(422);

        $count = Label::all()->count();
        $this->post('/api/v1/labels', [
            'name' => 'Sea Cucumber',
            'color' => '#0099ff',
        ]);
        // colors with hash are ok, too
        $this->assertResponseOk();
        $this->assertEquals($count + 1, Label::all()->count());

        $this->json('POST', '/api/v1/labels', [
            'name' => 'Stone',
            'parent_id' => 99999,
            'color' => '0099ff',
        ]);
        // parent label does not exist
        $this->assertResponseStatus(422);

        $this->post('/api/v1/labels', [
            'name' => 'Baby Sea Cucumber',
            'aphia_id' => 1234,
            'parent_id' => 1,
            'color' => '0099ff',
        ]);
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertEquals($count + 2, Label::all()->count());
        $label = Label::find(Label::max('id'));
        $this->assertEquals('Baby Sea Cucumber', $label->name);
        $this->assertEquals(1234, $label->aphia_id);
        $this->assertEquals(1, $label->parent->id);
        $this->assertEquals('0099ff', $label->color);

        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertNotContains('"parent":{', $content);
    }

    public function testStoreProjectSpecific()
    {
        $this->beUser();
        $this->post('/api/v1/labels', [
            'name' => 'test123',
            'project_id' => $this->project()->id,
            'color' => '0099ff',
        ]);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->json('POST', '/api/v1/labels', [
            'name' => 'test123',
            'project_id' => 9999,
            'color' => '0099ff',
        ]);
        // project does not exist
        $this->assertResponseStatus(422);

        $this->post('/api/v1/labels', [
            'name' => 'test123',
            'project_id' => $this->project()->id,
            'color' => '0099ff',
        ]);
        $this->assertResponseOk();

        $this->assertEquals(1, $this->project()->labels()->count());
    }

    public function testUpdate()
    {
        $label = LabelTest::create();

        $this->doTestApiRoute('PUT', '/api/v1/labels/'.$label->id);

        $this->beAdmin();
        $this->put('/api/v1/labels/'.$label->id);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->beGlobalAdmin();
        $this->put('/api/v1/labels/'.$label->id);
        $this->assertResponseOk();

        $this->json('PUT', '/api/v1/labels/'.$label->id, ['parent_id' => 9999]);
        // parent label dos not exist
        $this->assertResponseStatus(422);

        $this->assertNotEquals('random name abc', $label->name);
        $this->assertNull($label->parent);
        $this->assertNull($label->aphia_id);

        $this->put('/api/v1/labels/'.$label->id, [
            'name' => 'random name abc',
            'parent_id' => 1,
            'aphia_id' => 2,
            'color' => 'aabbcc',
        ]);

        $this->assertResponseOk();
        $label = $label->fresh();
        $this->assertEquals('random name abc', $label->name);
        $this->assertEquals(1, $label->parent->id);
        $this->assertEquals(2, $label->aphia_id);
        $this->assertEquals('aabbcc', $label->color);
    }

    public function testUpdateProjectSpecific()
    {
        $label = LabelTest::create(['project_id' => $this->project()->id]);

        $this->beUser();
        $this->put('/api/v1/labels/'.$label->id);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->put('/api/v1/labels/'.$label->id);
        $this->assertResponseOk();
    }

    public function testDestroy()
    {
        $label = LabelTest::create();

        $this->doTestApiRoute('DELETE', '/api/v1/labels/'.$label->id);

        $this->beAdmin();
        $this->delete('/api/v1/labels/'.$label->id);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->assertNotNull($label->fresh());
        $this->beGlobalAdmin();
        $this->delete('/api/v1/labels/'.$label->id);
        $this->assertResponseOk();
        $this->assertNull($label->fresh());

        $parent = LabelTest::create();
        $label = LabelTest::create(['parent_id' => $parent->id]);

        $this->delete('/api/v1/labels/'.$parent->id);
        // deleting a label with children without the 'force' argument fails
        $this->assertResponseStatus(400);

        $this->delete('/api/v1/labels/'.$parent->id, [
            'force' => 'abcd',
        ]);
        $this->assertResponseOk();
        $this->assertNull($parent->fresh());
        $this->assertNull($label->fresh());
    }

    public function testDestroyProjectSpecific()
    {
        $label = LabelTest::create(['project_id' => $this->project()->id]);

        $this->beUser();
        $this->delete('/api/v1/labels/'.$label->id);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->delete('/api/v1/labels/'.$label->id);
        $this->assertResponseOk();
    }

    public function testDestroyStillInUse()
    {
        $label = LabelTest::create();
        $annotation = AnnotationTest::create();
        AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id
        ]);

        $this->beGlobalAdmin();
        $this->delete('/api/v1/labels/'.$label->id);
        // you can't delete a label that is still in use
        $this->assertResponseStatus(400);
        $this->assertNotNull($label->fresh());
    }
}
