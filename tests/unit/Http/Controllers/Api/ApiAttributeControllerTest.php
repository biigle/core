<?php

use Dias\Attribute;

class ApiAttributeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->doTestApiRoute('GET', '/api/v1/attributes');

        // session cookie authentication
        $this->beUser();
        $this->get('/api/v1/attributes');
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/attributes/1');

        $this->beUser();
        $this->get('/api/v1/attributes/-1');
        $this->assertResponseStatus(404);

        $this->get('/api/v1/attributes/1');
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/attributes');

        // only global admins can create new attributes
        $this->beAdmin();
        $this->post('/api/v1/attributes');
        $this->assertResponseStatus(401);

        // missing arguments
        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/attributes');
        $this->assertResponseStatus(422);

        $this->json('POST', '/api/v1/attributes', [
            'name' => 'expert name',
            'type' => 'boolean',
        ]);
        // name must pass alpha_dash validation
        $this->assertResponseStatus(422);

        // enum data type is not supported in SQLite
        $this->json('POST', '/api/v1/attributes', [
            'name' => 'expert',
            'type' => 'own',
        ]);
        // unsupported type
        $this->assertResponseStatus(422);

        $count = Attribute::all()->count();
        $this->post('/api/v1/attributes', [
            'name' => 'expert',
            'type' => 'boolean',
        ]);
        $content = $this->response->getContent();
        $this->assertEquals($count + 1, Attribute::all()->count());
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);

        $this->json('POST', '/api/v1/attributes', [
            'name' => 'expert',
            'type' => 'boolean',
        ]);
        // name already exists
        $this->assertResponseStatus(422);
    }

    public function testDestroy()
    {
        $attribute = AttributeTest::create();
        $id = $attribute->id;

        $this->doTestApiRoute('DELETE', '/api/v1/attributes/'.$id);

        // only global admins can delete attributes
        $this->beAdmin();
        $this->delete('/api/v1/attributes/'.$id);
        $this->assertResponseStatus(401);

        $this->assertNotNull($attribute->fresh());
        $this->beGlobalAdmin();
        $this->delete('/api/v1/attributes/'.$id);
        $this->assertResponseOk();
        $this->assertNull($attribute->fresh());

        $this->delete('/api/v1/attributes/'.$id);
        // the attribute doesn't exist any more
        $this->assertResponseStatus(404);

        $attribute = AttributeTest::make();
        $project = ProjectTest::create();
        $project->attributes()->save($attribute);

        $this->delete('/api/v1/attributes/'.$attribute->id);
        // attributes in use may not be deleted
        $this->assertResponseStatus(400);
    }
}
