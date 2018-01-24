<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationSessionControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-05',
        ]);

        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);

        $this->doTestApiRoute('PUT', "api/v1/annotation-sessions/{$session->id}");

        $this->beEditor();
        $response = $this->put("api/v1/annotation-sessions/{$session->id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'hide_other_users_annotations' => 'abcd',
        ]);
        // must be bool
        $response->assertStatus(422);

        $response = $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => 'abcd',
        ]);
        // must be a date
        $response->assertStatus(422);

        $response = $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-05',
        ]);
        // end must be after start
        $response->assertStatus(422);

        $response = $this->json('PUT', "api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-04',
            'ends_at' => '2016-09-06',
        ]);
        // conflict with existing session
        $response->assertStatus(422);

        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'name' => 'my cool name',
            'ends_at' => '2016-09-07',
        ]);
        $response->assertStatus(200);

        $session = $session->fresh();

        $this->assertEquals('my cool name', $session->name);
        $this->assertEquals('2016-09-07', $session->ends_at->format('Y-m-d'));
    }

    public function testUpdateTimezones()
    {
        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-06',
        ]);

        $this->beAdmin();
        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'ends_at' => '2016-09-07T00:00:00.000+02:00',
        ]);
        $response->assertStatus(200);

        $session = $session->fresh();

        $this->assertTrue(Carbon::parse('2016-09-06T22:00:00.000Z')->eq($session->ends_at));
    }

    public function testUpdateForceStartDate()
    {
        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-07',
        ]);

        $image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $label = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $annotation->id,
        ]);

        $this->beAdmin();
        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-06',
        ]);
        // the annotation would no longer belong to the session
        $response->assertStatus(400);

        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'starts_at' => '2016-09-06',
            'force' => true,
        ]);
        $response->assertStatus(200);
    }

    public function testUpdateForceEndDate()
    {
        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-07',
        ]);

        $image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $label = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $annotation->id,
        ]);

        $this->beAdmin();
        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'ends_at' => '2016-09-06',
        ]);
        // the annotation would no longer belong to the session
        $response->assertStatus(400);

        $response = $this->put("api/v1/annotation-sessions/{$session->id}", [
            'ends_at' => '2016-09-06',
            'force' => true,
        ]);
        $response->assertStatus(200);
    }

    public function testDestroy()
    {
        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
        ]);

        $this->doTestApiRoute('DELETE', "api/v1/annotation-sessions/{$session->id}");

        $this->beEditor();
        $response = $this->delete("api/v1/annotation-sessions/{$session->id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->delete("api/v1/annotation-sessions/{$session->id}");
        $response->assertStatus(200);

        $this->assertNull($session->fresh());
    }

    public function testDestroyForce()
    {
        $session = AnnotationSessionTest::create([
            'project_id' => $this->project()->id,
            'starts_at' => '2016-09-05',
            'ends_at' => '2016-09-07',
        ]);

        $image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $label = AnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $annotation->id,
        ]);

        $this->beAdmin();
        $response = $this->delete("api/v1/annotation-sessions/{$session->id}");
        // there are annotations belonging to this session
        $response->assertStatus(400);

        $response = $this->delete("api/v1/annotation-sessions/{$session->id}", [
            'force' => true,
        ]);
        $response->assertStatus(200);
    }
}
