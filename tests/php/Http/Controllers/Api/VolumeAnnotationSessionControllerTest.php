<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\AnnotationSessionTest;
use Carbon\Carbon;

class VolumeAnnotationSessionControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;
        $session = AnnotationSessionTest::create([
            'volume_id' => $this->volume()->id,
        ]);
        $session->users()->attach($this->guest());

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotation-sessions");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/annotation-sessions");
        $response->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/volumes/{$id}/annotation-sessions")
            ->assertStatus(200)
            ->assertExactJson([$session->load('users')->toArray()]);
    }

    public function testStore()
    {
        $id = $this->volume()->id;
        AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-04',
        ]);

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/annotation-sessions");

        $this->beEditor();
        $response = $this->post("/api/v1/volumes/{$id}/annotation-sessions");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
            'users' => [$this->admin()->id],
        ]);
        // name is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'ends_at' => '2016-09-06',
            'users' => [$this->admin()->id],
        ]);
        // starts_at is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'users' => [$this->admin()->id],
        ]);
        // ends_at is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-04',
            'users' => [$this->admin()->id],
        ]);
        // end must be after start
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-03',
            'ends_at' => '2016-09-05',
            'users' => [$this->admin()->id],
        ]);
        // conflict with existing session
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);
        // users is required
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
            'users' => [-1],
        ]);
        // user does not exist
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
            'users' => [$this->user()->id],
        ]);
        // user must belong to volume
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
            'users' => [$this->admin()->id],
        ]);
        $response->assertSuccessful();
        $this->assertSame(2, $this->volume()->annotationSessions()->count());

        $session = $this->volume()->annotationSessions()
            ->with('users')
            ->orderBy('id', 'desc')
            ->first();
        $this->assertTrue($session->users()->where('id', $this->admin()->id)->exists());
        $response->assertExactJson($session->toArray());
    }

    public function testStoreTimezones()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/volumes/{$id}/annotation-sessions", [
            'name' => 'my session',
            'starts_at' => '2016-09-20T00:00:00.000+02:00',
            'ends_at' => '2016-09-21T00:00:00.000+02:00',
            'users' => [$this->admin()->id],
        ]);
        $response->assertSuccessful();

        $session = $this->volume()->annotationSessions()->first();

        $this->assertTrue(Carbon::parse('2016-09-19T22:00:00.000Z')->eq($session->starts_at));
        $this->assertTrue(Carbon::parse('2016-09-20T22:00:00.000Z')->eq($session->ends_at));
    }
}
