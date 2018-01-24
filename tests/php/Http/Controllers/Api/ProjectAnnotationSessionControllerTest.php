<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\AnnotationSessionTest;

class ProjectAnnotationSessionControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $session = AnnotationSessionTest::create(['project_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/annotation-sessions");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/annotation-sessions");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/projects/{$id}/annotation-sessions")
            ->assertStatus(200)
            ->assertExactJson([$session->toArray()]);
    }

    public function testStore()
    {
        $id = $this->project()->id;
        AnnotationSessionTest::create([
            'project_id' => $id,
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-04',
        ]);

        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/annotation-sessions");

        $this->beEditor();
        $response = $this->post("/api/v1/projects/{$id}/annotation-sessions");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);
        // name is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'ends_at' => '2016-09-06',
        ]);
        // starts_at is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
        ]);
        // ends_at is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-04',
        ]);
        // end must be after start
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-05',
        ]);
        // conflict with existing session
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);
        $response->assertStatus(200);
        $this->assertEquals(2, $this->project()->annotationSessions()->count());

        $session = $this->project()->annotationSessions()
            ->orderBy('id', 'desc')
            ->first();
        $response->assertExactJson($session->toArray());
    }

    public function testStoreTimezones()
    {
        $id = $this->project()->id;
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-20T00:00:00.000+02:00',
            'ends_at' => '2016-09-21T00:00:00.000+02:00',
        ]);
        $response->assertStatus(200);

        $session = $this->project()->annotationSessions()->first();

        $this->assertTrue(Carbon::parse('2016-09-19T22:00:00.000Z')->eq($session->starts_at));
        $this->assertTrue(Carbon::parse('2016-09-20T22:00:00.000Z')->eq($session->ends_at));
    }
}
