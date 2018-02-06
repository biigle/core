<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Cache;
use Session;
use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationLabelControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = AnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume);
    }

    public function testIndex()
    {
        AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $id = $this->annotation->id;
        $this->doTestApiRoute('GET', "/api/v1/annotations/{$id}/labels");

        // api key authentication
        $this->beUser();
        $response = $this->get("/api/v1/annotations/{$id}/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/annotations/{$id}/labels");
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
    }

    public function testIndexAnnotationSession()
    {
        $this->annotation->created_at = Carbon::yesterday();
        $this->annotation->save();

        $session = AnnotationSessionTest::create([
            'volume_id' => $this->annotation->image->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $this->beAdmin();
        $response = $this->get("api/v1/annotations/{$this->annotation->id}/labels");
        $response->assertStatus(200);

        $session->users()->attach($this->admin());
        Cache::flush();

        $response = $this->get("api/v1/annotations/{$this->annotation->id}/labels");
        $response->assertStatus(403);
    }

    public function testStore()
    {
        $id = $this->annotation->id;
        $this->doTestApiRoute('POST', "/api/v1/annotations/{$id}/labels");

        // missing arguments
        $this->beEditor();
        $response = $this->json('POST', "/api/v1/annotations/{$id}/labels");
        $response->assertStatus(422);

        $this->assertEquals(0, $this->annotation->labels()->count());

        $this->beUser();
        $response = $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(201);
        $this->assertEquals(1, $this->annotation->labels()->count());

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        $response->assertStatus(201);
        $this->assertEquals(2, $this->annotation->labels()->count());
        $response->assertJsonFragment([
            'id' => $this->labelRoot()->id,
            'name' => $this->labelRoot()->name,
            'parent_id' => $this->labelRoot()->parent_id,
            'color' => $this->labelRoot()->color,
        ]);
        $response->assertJsonFragment([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
        $response->assertJsonFragment(['confidence' => 0.1]);

        $response = $this->post("/api/v1/annotations/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'confidence' => 0.1,
        ]);
        // the same user cannot attach the same label twice
        $response->assertStatus(400);
        $this->assertEquals(2, $this->annotation->labels()->count());
    }

    public function testUpdate()
    {
        $annotationLabel = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
            'confidence' => 0.5,
        ]);
        $id = $annotationLabel->id;

        $this->doTestApiRoute('PUT', '/api/v1/annotation-labels/'.$id);

        $this->beUser();
        $response = $this->put('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->put('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->put('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(200);

        $this->beAdmin();
        $response = $this->put('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(200);

        $this->assertEquals(0.5, $annotationLabel->fresh()->confidence);
        $this->beEditor();
        $response = $this->put('/api/v1/annotation-labels/'.$id, [
            '_token' => Session::token(),
            'confidence' => 0.1,
        ]);
        $response->assertStatus(200);
        $this->assertEquals(0.1, $annotationLabel->fresh()->confidence);
    }

    public function testDestroy()
    {
        $id = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', '/api/v1/annotation-labels/'.$id);

        $this->beUser();
        $response = $this->delete('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());
        $this->beEditor();
        $response = $this->delete('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/annotation-labels/'.$id2);
        // not the own label
        $response->assertStatus(403);

        $this->assertTrue($this->annotation->labels()->where('id', $id2)->exists());

        $id = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->annotation->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $response = $this->delete('/api/v1/annotation-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/annotation-labels/'.$id2);
        $response->assertStatus(200);
        $this->assertFalse($this->annotation->labels()->exists());
    }

    public function testDestroyLast()
    {
        $id = AnnotationLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = AnnotationLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'annotation_id' => $this->annotation->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $this->beEditor();
        $response = $this->delete("/api/v1/annotation-labels/{$id}");
        $response->assertStatus(200);

        $this->assertNotNull($this->annotation->fresh());

        $response = $this->delete("/api/v1/annotation-labels/{$id2}");
        $response->assertStatus(200);
        $this->assertNull($this->annotation->fresh());
    }
}
