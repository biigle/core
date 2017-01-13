<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;

class ProjectControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->get('/api/v1/projects');
        $this->assertResponseStatus(405);

        $this->doTestApiRoute('GET', '/api/v1/projects/my');

        $this->beAdmin();
        $this->get('/api/v1/projects/my');
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
        $this->assertContains('"description":"', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testShow()
    {
        // create project
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->get('/api/v1/projects/999');
        $this->assertResponseStatus(404);

        $this->get("/api/v1/projects/{$id}");
        $content = $this->response->getContent();
        $this->assertResponseOk();

        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"description":"', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testUpdate()
    {
        $this->doTestApiRoute('PUT', '/api/v1/projects/1');

        // non-admins are not allowed to update
        $this->beEditor();
        $this->put('/api/v1/projects/1');
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->put('/api/v1/projects/999');
        $this->assertResponseStatus(404);

        $this->json('PUT', '/api/v1/projects/1', [
            'name' => '',
        ]);
        // name must not be empty if it is present
        $this->assertResponseStatus(422);

        $this->json('PUT', '/api/v1/projects/1', [
            'description' => '',
        ]);
        // description must not be empty if it is present
        $this->assertResponseStatus(422);

        $this->json('PUT', '/api/v1/projects/1', [
            'name' => 'my test',
            'description' => 'this is my test',
            'creator_id' => 5,
        ]);
        $this->assertResponseOk();

        $project = $this->project()->fresh();
        $this->assertEquals('my test', $project->name);
        $this->assertEquals('this is my test', $project->description);
        $this->assertNotEquals(5, $project->creator_id);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/projects');

        // creating an empty project is an error
        $this->beAdmin();
        $this->json('POST', '/api/v1/projects');
        $this->assertResponseStatus(422);

        $this->assertNull(Project::find(2));

        $this->json('POST', '/api/v1/projects', [
            'name' => 'test project',
            'description' => 'my test project',
        ]);

        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"name":"test project"', $content);
        $this->assertNotNull(Project::find(2));
    }

    public function testDestroy()
    {
        $id = $this->project()->id;
        // create volume
        $this->volume();

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$id}");

        // non-admins are not allowed to delete the project
        $this->beEditor();
        $this->json('DELETE', "/api/v1/projects/{$id}");
        $this->assertResponseStatus(403);

        // project still has a volume belonging only to this project
        $this->beAdmin();
        $this->assertNotNull($this->project()->fresh());
        $this->json('DELETE', "/api/v1/projects/{$id}");
        $this->assertResponseStatus(400);

        $this->assertNotNull($this->project()->fresh());
        $this->json('DELETE', "/api/v1/projects/{$id}", ['force' => 'true']);
        $this->assertResponseOk();
        $this->assertNull($this->project()->fresh());

        // already deleted projects can't be re-deleted
        $this->delete("/api/v1/projects/{$id}");
        $this->assertResponseStatus(404);
    }
}
