<?php

use Dias\Contracts\BelongsToProjectContract;

abstract class ModelWithAttributesApiTest extends ApiTestCase
{
    private $model;

    private $endpoint;

    abstract protected function getEndpoint();

    abstract protected function getModel();

    public function setUp()
    {
        parent::setUp();
        $this->model = $this->getModel();
        $this->model->save();
        $this->endpoint = $this->getEndpoint().'/'.$this->model->id.'/attributes';
        $this->model->attributes()->save(AttributeTest::create());
    }

    public function testAttributesIndex()
    {
        // $attr = AttributeTest::create();
        // $this->model->attributes()->save($attr);
        $this->doTestApiRoute('GET', $this->endpoint);

        $this->beUser();
        $this->call('GET', $this->endpoint);

        if ($this->model instanceof BelongsToProjectContract) {
            $this->assertResponseStatus(401);
        } else {
            $this->assertResponseOk();
        }

        $this->beAdmin();
        $r = $this->call('GET', $this->endpoint);
        $this->assertResponseOk();
        $this->assertStringStartsWith('[{', $r->getContent());
        $this->assertStringEndsWith('}]', $r->getContent());
        $this->assertContains('"name"', $r->getContent());
        $this->assertContains('"type"', $r->getContent());
        $this->assertContains('"value_int"', $r->getContent());
        $this->assertContains('"value_double"', $r->getContent());
        $this->assertContains('"value_string"', $r->getContent());
    }

    public function testAttributesShow()
    {
        $this->model->attributes()->save(AttributeTest::create(['name' => 'my-test']));

        $this->doTestApiRoute('GET', $this->endpoint.'/my-test');

        $this->beUser();
        $this->call('GET', $this->endpoint.'/my-test');

        if ($this->model instanceof BelongsToProjectContract) {
            $this->assertResponseStatus(401);
        } else {
            $this->assertResponseOk();
        }

        $this->beAdmin();
        $this->call('GET', $this->endpoint.'/my-test123');
        $this->assertResponseStatus(404);

        $this->beAdmin();
        $r = $this->call('GET', $this->endpoint.'/my-test');
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertContains('"name":"my-test"', $r->getContent());
    }

    public function testAttributesStore()
    {
        AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        AttributeTest::create(['name' => 'my-test2', 'type' => 'integer']);

        $this->doTestApiRoute('POST', $this->endpoint);

        if ($this->model instanceof BelongsToProjectContract) {
            $this->beGuest();
            $this->call('POST', $this->endpoint, [
                'name'  => 'my-test',
                'value' => 123,
            ]);
            // guest is not allowed to edit the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->beEditor();
            $this->call('POST', $this->endpoint, [
                'name'  => 'my-test',
                'value' => 123,
            ]);
            // editor is not allowed to edit the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->beAdmin();
            $this->call('POST', $this->endpoint, [
                'name'  => 'my-test',
                'value' => 123,
            ]);
            // only global admins are allowed to edit labels or users
            $this->assertResponseStatus(401);
        }

        // global admin is not member of the project, so change the user to
        // project admin if the tested model belongs to a project
        $user = $this->globalAdmin();
        if ($this->model instanceof BelongsToProjectContract) {
            $user = $this->admin();
        }

        $this->be($user);
        $this->json('POST', $this->endpoint);
        // missing arguments
        $this->assertResponseStatus(422);

        $this->json('POST', $this->endpoint, [
            'name'  => 'my-test123',
            'value' => 123,
        ]);
        // does not exist
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $this->model->attributes()->count());
        $this->call('POST', $this->endpoint, [
            'name'  => 'my-test',
            'value' => 123,
        ]);

        $this->assertResponseStatus(201);
        $this->assertEquals(2, $this->model->attributes()->count());

        $this->call('POST', $this->endpoint, [
            '_token' => Session::token(),
            'name'  => 'my-test',
            'value' => 123,
        ]);
        // the same attribute can only be attached once
        $this->assertResponseStatus(400);

        $r = $this->call('POST', $this->endpoint, [
            '_token' => Session::token(),
            'name'  => 'my-test2',
            'value' => 123,
        ]);
        $this->assertResponseStatus(201);
        $this->assertStringStartsWith('{', $r->getContent());
        $this->assertStringEndsWith('}', $r->getContent());
        $this->assertContains('"name":"my-test2"', $r->getContent());
    }

    public function testAttributesUpdate()
    {
        AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        $this->model->attachDiasAttribute('my-test', 123);

        $this->doTestApiRoute('PUT', $this->endpoint.'/my-test');

        if ($this->model instanceof BelongsToProjectContract) {
            $this->beGuest();
            $this->call('PUT', $this->endpoint.'/my-test', [
                'value' => 321,
            ]);
            // guest is not allowed to edit the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->beEditor();
            $this->call('PUT', $this->endpoint.'/my-test', [
                'value' => 321,
            ]);
            // editor is not allowed to edit the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->beAdmin();
            $this->call('PUT', $this->endpoint.'/my-test', [
                'value' => 123,
            ]);
            // only global admins are allowed to edit labels
            $this->assertResponseStatus(401);
        }

        // global admin is not member of the project, so change the user to
        // project admin if the tested model belongs to a project
        $user = $this->globalAdmin();
        if ($this->model instanceof BelongsToProjectContract) {
            $user = $this->admin();
        }

        $this->be($user);
        $this->json('PUT', $this->endpoint.'/my-test');
        // missing arguments
        $this->assertResponseStatus(422);

        $this->call('PUT', $this->endpoint.'/my-test123', [
            'value' => 321,
        ]);
        // model does not have this attribute
        $this->assertResponseStatus(404);

        $this->assertEquals(
            123,
            $this->model->attributes()->whereName('my-test')->first()->value_int
        );

        $this->call('PUT', $this->endpoint.'/my-test', [
            'value' => 321,
        ]);
        $this->assertResponseOk();

        $this->assertEquals(
            321,
            $this->model->attributes()->whereName('my-test')->first()->value_int
        );
    }

    public function testAttributesDestroy()
    {
        AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        $this->model->attachDiasAttribute('my-test', 123);

        $this->doTestApiRoute('DELETE', $this->endpoint.'/my-test');

        if ($this->model instanceof BelongsToProjectContract) {
            $this->beGuest();
            $this->call('DELETE', $this->endpoint.'/my-test');
            // guest is not allowed to detach the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->beEditor();
            $this->call('DELETE', $this->endpoint.'/my-test');
            // editor is not allowed to detach the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->beAdmin();
            $this->call('DELETE', $this->endpoint.'/my-test', [
                'value' => 123,
            ]);
            // only global admins are allowed to edit labels
            $this->assertResponseStatus(401);
        }

        // global admin is not member of the project, so change the user to
        // project admin if the tested model belongs to a project
        $user = $this->globalAdmin();
        if ($this->model instanceof BelongsToProjectContract) {
            $user = $this->admin();
        }

        $this->be($user);
        $this->call('DELETE', $this->endpoint.'/nonexistant');
        $this->assertResponseStatus(404);

        $count = $this->model->attributes()->count();
        $this->call('DELETE', $this->endpoint.'/my-test');
        $this->assertResponseOk();
        $this->assertEquals($count - 1, $this->model->attributes()->count());
    }
}
