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

        $this->callToken('GET', $this->endpoint, $this->user());

        if ($this->model instanceof BelongsToProjectContract) {
            $this->assertResponseStatus(401);
        } else {
            $this->assertResponseOk();
        }

        // api key authentication
        $this->callToken('GET', $this->endpoint, $this->admin());
        $this->assertResponseOk();

        $this->be($this->admin());
        $r = $this->call('GET', $this->endpoint);
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

        $this->callToken('GET', $this->endpoint.'/my-test', $this->user());

        if ($this->model instanceof BelongsToProjectContract) {
            $this->assertResponseStatus(401);
        } else {
            $this->assertResponseOk();
        }

        $this->callToken('GET', $this->endpoint.'/my-test123', $this->admin());
        $this->assertResponseStatus(404);

        // api key authentication
        $this->callToken('GET', $this->endpoint.'/my-test', $this->admin());
        $this->assertResponseOk();

        $this->be($this->admin());
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
            $this->callToken('POST', $this->endpoint, $this->guest(), [
                'name'  => 'my-test',
                'value' => 123,
            ]);
            // guest is not allowed to edit the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->callToken('POST', $this->endpoint, $this->editor(), [
                'name'  => 'my-test',
                'value' => 123,
            ]);
            // editor is not allowed to edit the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->callToken('POST', $this->endpoint, $this->admin(), [
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

        $this->callToken('POST', $this->endpoint, $user);
        // missing arguments
        $this->assertResponseStatus(422);

        $this->callToken('POST', $this->endpoint, $user, [
            'name'  => 'my-test123',
            'value' => 123,
        ]);
        // does not exist
        $this->assertResponseStatus(422);

        // api key authentication
        $this->assertEquals(1, $this->model->attributes()->count());
        $this->callToken('POST', $this->endpoint, $user, [
            'name'  => 'my-test',
            'value' => 123,
        ]);
        $this->assertResponseStatus(201);
        $this->assertEquals(2, $this->model->attributes()->count());

        $this->be($user);
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
            $this->callToken('PUT', $this->endpoint.'/my-test', $this->guest(), [
                'value' => 321,
            ]);
            // guest is not allowed to edit the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->callToken('PUT', $this->endpoint.'/my-test', $this->editor(), [
                'value' => 321,
            ]);
            // editor is not allowed to edit the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->callToken('PUT', $this->endpoint.'/my-test', $this->admin(), [
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

        $this->callToken('PUT', $this->endpoint.'/my-test', $user);
        // missing arguments
        $this->assertResponseStatus(422);

        $this->callToken('PUT', $this->endpoint.'/my-test123', $user, [
            'value' => 321,
        ]);
        // model does not have this attribute
        $this->assertResponseStatus(404);

        // api key authentication
        $this->assertEquals(
            123,
            $this->model->attributes()->whereName('my-test')->first()->value_int
        );

        $this->callToken('PUT', $this->endpoint.'/my-test', $user, [
            'value' => 321,
        ]);
        $this->assertResponseOk();

        $this->assertEquals(
            321,
            $this->model->attributes()->whereName('my-test')->first()->value_int
        );

        $this->be($user);

        $this->call('PUT', $this->endpoint.'/my-test', [
            '_token' => Session::token(),
            'name'  => 'my-test2',
            'value' => 987,
        ]);
        $this->assertResponseOk();
    }

    public function testAttributesDestroy()
    {
        AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        $this->model->attachDiasAttribute('my-test', 123);

        $this->doTestApiRoute('DELETE', $this->endpoint.'/my-test');

        if ($this->model instanceof BelongsToProjectContract) {
            $this->callToken('DELETE', $this->endpoint.'/my-test', $this->guest());
            // guest is not allowed to detach the attributes
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Project) {
            $this->callToken('DELETE', $this->endpoint.'/my-test', $this->editor());
            // editor is not allowed to detach the attributes of a project
            $this->assertResponseStatus(401);
        }

        if ($this->model instanceof Dias\Label || $this->model instanceof Dias\User) {
            $this->callToken('DELETE', $this->endpoint.'/my-test', $this->admin(), [
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

        $this->callToken('DELETE', $this->endpoint.'/nonexistant', $user);
        $this->assertResponseStatus(404);

        $count = $this->model->attributes()->count();
        $this->callToken('DELETE', $this->endpoint.'/my-test', $user);
        $this->assertResponseOk();
        $this->assertEquals($count - 1, $this->model->attributes()->count());
    }
}
