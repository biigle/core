<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;

class ProjectControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $response = $this->get('/api/v1/projects');
        $response->assertStatus(405);

        $this->doTestApiRoute('GET', '/api/v1/projects/my');

        $this->beAdmin();
        $response = $this->get('/api/v1/projects/my');
        $content = $response->getContent();
        $response->assertStatus(200);
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
        $response = $this->get("/api/v1/projects/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get('/api/v1/projects/999');
        $response->assertStatus(404);

        $response = $this->get("/api/v1/projects/{$id}");
        $content = $response->getContent();
        $response->assertStatus(200);

        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"description":"', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testUpdate()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('PUT', "/api/v1/projects/{$id}");

        // non-admins are not allowed to update
        $this->beEditor();
        $response = $this->put("/api/v1/projects/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->put('/api/v1/projects/999');
        $response->assertStatus(404);

        $response = $this->json('PUT', "/api/v1/projects/{$id}", [
            'name' => '',
        ]);
        // name must not be empty if it is present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/projects/{$id}", [
            'description' => '',
        ]);
        // description must not be empty if it is present
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/projects/{$id}", [
            'name' => 'my test',
            'description' => 'this is my test',
            'creator_id' => 5,
        ]);
        $response->assertStatus(200);

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
        $response = $this->json('POST', '/api/v1/projects');
        $response->assertStatus(422);

        $this->assertEquals(1, Project::count());

        $response = $this->json('POST', '/api/v1/projects', [
            'name' => 'test project',
            'description' => 'my test project',
        ]);

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"name":"test project"', $content);
        $this->assertEquals(2, Project::count());
    }

    public function testDestroy()
    {
        $id = $this->project()->id;
        // create volume
        $this->volume();

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$id}");

        // non-admins are not allowed to delete the project
        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/projects/{$id}");
        $response->assertStatus(403);

        // project still has a volume belonging only to this project
        $this->beAdmin();
        // $this->assertNotNull($this->project()->fresh());
        // $response = $this->json('DELETE', "/api/v1/projects/{$id}");
        // $response->assertStatus(400);

        $this->assertNotNull($this->project()->fresh());
        $response = $this->json('DELETE', "/api/v1/projects/{$id}", ['force' => 'true']);
        $response->assertStatus(200);
        $this->assertNull($this->project()->fresh());

        // already deleted projects can't be re-deleted
        $response = $this->delete("/api/v1/projects/{$id}");
        $response->assertStatus(404);

        $this->markTestIncomplete('Require force if this would delete annotations?');
    }
}
