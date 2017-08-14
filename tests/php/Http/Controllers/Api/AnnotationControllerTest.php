<?php

namespace Biigle\Tests\Http\Controllers\Api;

use Cache;
use Biigle\Shape;
use ApiTestCase;
use Carbon\Carbon;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationSessionTest;

class AnnotationControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp()
    {
        parent::setUp();
        $this->annotation = AnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume_id);
    }

    public function testShow()
    {
        $id = $this->annotation->id;
        $this->annotation->points = [10, 10, 20, 20];
        $this->annotation->save();
        $this->doTestApiRoute('GET', "api/v1/annotations/{$id}");

        $this->beEditor();
        $response = $this->get("api/v1/annotations/{$id}");
        $response->assertStatus(200);

        $this->beGuest();
        $response = $this->get("api/v1/annotations/{$id}");
        $response->assertStatus(200);

        $this->beUser();
        $response = $this->get("api/v1/annotations/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->get("api/v1/annotations/{$id}")
            ->assertJsonFragment(['points' => [10, 10, 20, 20]]);
        // the labels should be fetched separately
        $this->assertNotContains('labels', $response->getContent());
        // image and volume objects from projectIds() call shouldn't be
        // included in the output
        $this->assertNotContains('"image"', $response->getContent());
        $this->assertNotContains('volume', $response->getContent());
    }

    public function testShowAnnotationSession()
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
        $response = $this->get("api/v1/annotations/{$this->annotation->id}");
        $response->assertStatus(200);

        $session->users()->attach($this->admin());
        Cache::flush();

        $response = $this->get("api/v1/annotations/{$this->annotation->id}");
        $response->assertStatus(403);
    }

    public function testUpdate()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('PUT', "api/v1/annotations/{$id}");

        $this->beUser();
        $response = $this->put("api/v1/annotations/{$id}");
        $response->assertStatus(403);

        $this->annotation->points = [10, 10];
        $this->annotation->save();

        $this->beAdmin();
        $response = $this->put("api/v1/annotations/{$id}", ['points' => '[10, 15, 100, 200]']);
        $response->assertStatus(200);

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(4, sizeof($this->annotation->points));
        $this->assertEquals(15, $this->annotation->points[1]);

        $response = $this->json('PUT', "api/v1/annotations/{$id}", ['points' => [20, 25]]);
        $response->assertStatus(200);

        $this->annotation = $this->annotation->fresh();

        $this->assertEquals(2, sizeof($this->annotation->points));
        $this->assertEquals(25, $this->annotation->points[1]);
    }

    public function testUpdateValidatePoints()
    {
        $id = $this->annotation->id;
        $this->annotation->shape_id = Shape::$pointId;
        $this->annotation->save();

        $this->beAdmin();
        $response = $this->json('PUT', "api/v1/annotations/{$id}", ['points' => [10, 15, 100, 200]]);
        // invalid number of points
        $response->assertStatus(422);
    }

    public function testDestroy()
    {
        $id = $this->annotation->id;

        $this->doTestApiRoute('DELETE', "api/v1/annotations/{$id}");

        $this->beUser();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(403);

        $this->assertNotNull($this->annotation->fresh());

        $this->beAdmin();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(200);

        $this->assertNull($this->annotation->fresh());

        $this->annotation = AnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume);
        $id = $this->annotation->id;

        $this->beUser();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(200);

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $response = $this->delete("api/v1/annotations/{$id}");
        $response->assertStatus(404);
    }
}
