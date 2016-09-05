<?php

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

        $this->put("api/v1/annotation-sessions/{$session->id}", [
            'name' => 'my cool name',
            'ends_at' => '2016-09-07',
        ]);
        $this->assertResponseOk();

        $this->assertEquals('my cool name', $session->fresh()->name);
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
