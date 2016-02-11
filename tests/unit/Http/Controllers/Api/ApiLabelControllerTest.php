<?php

use Dias\Label;

class ApiLabelControllerTest extends ModelWithAttributesApiTest
{
    protected function getEndpoint()
    {
        return '/api/v1/labels';
    }

    protected function getModel()
    {
        return LabelTest::create();
    }

    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/labels/');

        // api key authentication
        $this->callToken('GET', '/api/v1/labels/', $this->user);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user);
        $r = $this->call('GET', '/api/v1/labels');
        $this->assertStringStartsWith('[{', $r->getContent());
        $this->assertStringEndsWith('}]', $r->getContent());
    }

    public function testIndexNotProjectLabels()
    {
        // output should not contain project specific labels
        $project = ProjectTest::create();
        $label = LabelTest::create(['project_id' => $project->id, 'name' => 'test123']);

        $this->be($this->user);
        $r = $this->call('GET', '/api/v1/labels');
        $this->assertNotContains('test123', $r->getContent());
    }

    public function testShow()
    {
        $label = LabelTest::create();
        $this->doTestApiRoute('GET', '/api/v1/labels/'.$label->id);

        // api key authentication
        $this->callToken('GET', '/api/v1/labels/99999', $this->user);
        $this->assertResponseStatus(404);

        $this->callToken('GET', '/api/v1/labels/'.$label->id, $this->user);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->user);
        $r = $this->call('GET', '/api/v1/labels/'.$label->id);
        // response should not be an empty array
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
    }

    public function testShowNotProjectLabels()
    {
        // output should not contain project specific labels
        $project = ProjectTest::create();
        $label = LabelTest::create(['project_id' => $project->id, 'name' => 'test123']);

        $this->be($this->user);
        $this->call('GET', '/api/v1/labels/'.$label->id);
        $this->assertResponseStatus(404);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/labels');

        // api key authentication
        $this->callToken('POST', '/api/v1/labels', $this->admin, [
            'name' => 'Sea Cucumber',
            'color' => '0099ff',
        ]);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->callToken('POST', '/api/v1/labels', $this->globalAdmin, [
            'name' => 'Sea Cucumber',
        ]);
        // missing color
        $this->assertResponseStatus(422);

        $this->callToken('POST', '/api/v1/labels', $this->globalAdmin, [
            'color' => '0099ff',
        ]);
        // missing name
        $this->assertResponseStatus(422);

        $this->callToken('POST', '/api/v1/labels', $this->globalAdmin, [
            'name' => 'Sea Cucumber',
            'color' => '00wwff',
        ]);
        // malformed color
        $this->assertResponseStatus(422);

        $this->callToken('POST', '/api/v1/labels', $this->globalAdmin, [
            'name' => 'Sea Cucumber',
            'color' => '0099fff',
        ]);
        // still malformed color
        $this->assertResponseStatus(422);

        $count = Label::all()->count();
        $this->callToken('POST', '/api/v1/labels', $this->globalAdmin, [
            'name' => 'Sea Cucumber',
            'color' => '#0099ff',
        ]);
        // colors with hash are ok, too
        $this->assertResponseOk();
        $this->assertEquals($count + 1, Label::all()->count());

        $this->be($this->globalAdmin);

        $this->callAjax('POST', '/api/v1/labels', [
            '_token' => Session::token(),
            'name' => 'Stone',
            'parent_id' => 99999,
            'color' => '0099ff',
        ]);
        // parent label does not exist
        $this->assertResponseStatus(422);

        $r = $this->call('POST', '/api/v1/labels', [
            '_token' => Session::token(),
            'name' => 'Baby Sea Cucumber',
            'aphia_id' => 1234,
            'parent_id' => 1,
            'color' => '0099ff',
        ]);
        $this->assertResponseOk();
        $this->assertEquals($count + 2, Label::all()->count());
        $label = Label::find(Label::max('id'));
        $this->assertEquals('Baby Sea Cucumber', $label->name);
        $this->assertEquals(1234, $label->aphia_id);
        $this->assertEquals(1, $label->parent->id);
        $this->assertEquals('0099ff', $label->color);

        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertNotContains('"parent":{', $r->getContent());
    }

    public function testStoreProjectSpecific()
    {
        $this->callToken('POST', '/api/v1/labels', $this->user, [
            'name' => 'test123',
            'project_id' => $this->project->id,
            'color' => '0099ff',
        ]);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->callToken('POST', '/api/v1/labels', $this->admin, [
            'name' => 'test123',
            'project_id' => 9999,
            'color' => '0099ff',
        ]);
        // project does not exist
        $this->assertResponseStatus(422);

        $this->be($this->admin);
        $this->call('POST', '/api/v1/labels', [
            '_token' => Session::token(),
            'name' => 'test123',
            'project_id' => $this->project->id,
            'color' => '0099ff',
        ]);
        $this->assertResponseOk();

        $this->assertEquals(1, $this->project->labels()->count());
    }

    public function testUpdate()
    {
        $label = LabelTest::create();

        $this->doTestApiRoute('PUT', '/api/v1/labels/'.$label->id);

        // api key authentication
        $this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->admin);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->globalAdmin);
        $this->assertResponseOk();

        $this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->globalAdmin, ['parent_id' => 9999]);
        // parent label dos not exist
        $this->assertResponseStatus(422);

        // session cookie authentication
        $this->be($this->globalAdmin);
        $this->assertNotEquals('random name abc', $label->name);
        $this->assertNull($label->parent);
        $this->assertNull($label->aphia_id);

        $this->call('PUT', '/api/v1/labels/'.$label->id, [
            '_token' => Session::token(),
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
        $label = LabelTest::create(['project_id' => $this->project->id]);

        $this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->user);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->callToken('PUT', '/api/v1/labels/'.$label->id, $this->admin);
        $this->assertResponseOk();
    }

    public function testDestroy()
    {
        $label = LabelTest::create();

        $this->doTestApiRoute('DELETE', '/api/v1/labels/'.$label->id);

        // api key authentication
        $this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->admin);
        // only global admins have access
        $this->assertResponseStatus(401);

        $this->assertNotNull($label->fresh());
        $this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->globalAdmin);
        $this->assertResponseOk();
        $this->assertNull($label->fresh());

        $parent = LabelTest::create();
        $label = LabelTest::create(['parent_id' => $parent->id]);

        // session cookie authentication
        $this->be($this->globalAdmin);
        $this->call('DELETE', '/api/v1/labels/'.$parent->id, [
            '_token' => Session::token(),
        ]);
        // deleting a label with children without the 'force' argument fails
        $this->assertResponseStatus(400);

        $this->call('DELETE', '/api/v1/labels/'.$parent->id, [
            '_token' => Session::token(),
            'force' => 'abcd',
        ]);
        $this->assertResponseOk();
        $this->assertNull($parent->fresh());
        $this->assertNull($label->fresh());
    }

    public function testDestroyProjectSpecific()
    {
        $label = LabelTest::create(['project_id' => $this->project->id]);

        $this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->user);
        // only project admins have access
        $this->assertResponseStatus(401);

        $this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->admin);
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

        $this->callToken('DELETE', '/api/v1/labels/'.$label->id, $this->globalAdmin);
        // you can't delete a label that is still in use
        $this->assertResponseStatus(400);
        $this->assertNotNull($label->fresh());
    }
}
