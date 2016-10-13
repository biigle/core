<?php

use Carbon\Carbon;

class ApiAnnotationSessionControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        AnnotationSessionTest::create([
            'transect_id' => $this->transect()->id,
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-05',
        ]);

        $session = AnnotationSessionTest::create([
            'transect_id' => $this->transect()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);
        $session->users()->attach([$this->guest()->id, $this->editor()->id]);

        $this->doTestApiRoute('PUT', "api/v1/annotation-sessions/{$session->id}");

        $this->beEditor();
        $this->put("api/v1/annotation-sessions/{$session->id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'hide_other_users_annotations' => 'abcd',
        ]);
        // must be bool
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => 'abcd',
        ]);
        // must be a date
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-05',
        ]);
        // end must be after start
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-06',
        ]);
        // conflict with existing session
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'users' => [999],
        ]);
        // user does not exist
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'users' => [],
        ]);
        // users must not be empty
        $this->assertResponseStatus(422);

        $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'users' => [$this->user()->id],
        ]);
        // user does not belong to transect
        $this->assertResponseStatus(422);

        $this->put("api/v1/annotation-sessions/{$session->id}", [
            'name' => 'my cool name',
            'ends_at' => '2016-09-07',
            'users' => [$this->admin()->id],
        ]);
        $this->assertResponseOk();

        $session = $session->fresh();

        $this->assertEquals('my cool name', $session->name);
        $this->assertEquals('2016-09-07', $session->ends_at->format('Y-m-d'));
        $this->assertEquals([$this->admin()->id], $session->users()->pluck('id')->all());
    }

    public function testUpdateTimezones()
    {
        $session = AnnotationSessionTest::create([
            'transect_id' => $this->transect()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);

        $this->beAdmin();
        $this->put("api/v1/annotation-sessions/{$session->id}", [
            'ends_at' => '2016-09-07T00:00:00.000+02:00',
        ]);
        $this->assertResponseOk();

        $session = $session->fresh();

        $this->assertTrue(Carbon::parse('2016-09-06T22:00:00.000Z')->eq($session->ends_at));
    }

    public function testDestroy()
    {
        $session = AnnotationSessionTest::create([
            'transect_id' => $this->transect()->id,
        ]);

        $this->doTestApiRoute('DELETE', "api/v1/annotation-sessions/{$session->id}");

        $this->beEditor();
        $this->delete("api/v1/annotation-sessions/{$session->id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->delete("api/v1/annotation-sessions/{$session->id}");
        $this->assertResponseOk();

        $this->assertNull($session->fresh());
    }
}
