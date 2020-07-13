<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Cache;
use Carbon\Carbon;

class AnnotationControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp(): void
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
        $this->assertStringNotContainsString('labels', $response->getContent());
        // image and volume objects from projectIds() call shouldn't be
        // included in the output
        $this->assertStringNotContainsString('"image"', $response->getContent());
        $this->assertStringNotContainsString('volume', $response->getContent());
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

    public function testStore()
    {
        $this->doTestApiRoute('POST', 'api/v1/annotations');

        $image = ImageTest::create();
        $this->beUser();
        $this->postJson('api/v1/annotations', [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this->beEditor();
        $this->postJson('api/v1/annotations', [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this->postJson('api/v1/annotations', [
                [
                    'image_id' => $image->id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ]
            ])
            ->assertStatus(403);

        $this->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ]
            ])
            ->assertStatus(200);

        $this->assertEquals(3, $this->annotation->image->annotations()->count());
        $annotation = $this->annotation->image->annotations()->orderBy('id', 'desc')->first();
        $this->assertEquals(Shape::pointId(), $annotation->shape_id);
        $this->assertEquals([100, 100], $annotation->points);
        $this->assertEquals(1, $annotation->labels()->count());
        $this->assertEquals($this->labelRoot()->id, $annotation->labels()->first()->label_id);
    }

    public function testStoreValidation()
    {
        $this->beEditor();
        $this->postJson('api/v1/annotations', [[
                'image_id' => 999,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this->postJson('api/v1/annotations', [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this->postJson('api/v1/annotations', [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => 999,
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this->postJson('api/v1/annotations', [[
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this->postJson('api/v1/annotations', [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => 999,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => $this->labelRoot()->id,
                    'confidence' => 1.0,
                ],
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => LabelTest::create()->id,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(403);

        $this->postJson('api/v1/annotations', [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 999,
            ]])
            ->assertStatus(422);

        $this->assertEquals(1, $this->annotation->image->annotations()->count());
    }

    public function testStoreLimit()
    {
        $data = [];
        for ($i=0; $i < 101; $i++) {
            $data[] = [
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ];
        }

        $this->beEditor();
        $this->postJson('api/v1/annotations', $data)
            ->assertStatus(422);
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
        $response = $this->put("api/v1/annotations/{$id}", ['points' => [10, 15, 100, 200]]);
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
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();

        $this->beAdmin();
        $response = $this->json('PUT', "api/v1/annotations/{$id}", ['points' => [10, 15, 100, 200]]);
        // invalid number of points
        $response->assertStatus(422);

        // Points must be array.
        $this->json('PUT', "api/v1/annotations/{$id}")
            ->assertStatus(422);
    }

    public function testUpdateChangeShape()
    {
        $id = $this->annotation->id;
        $this->annotation->points = [100, 200];
        $this->annotation->shape_id = Shape::pointId();
        $this->annotation->save();

        $this->beEditor();
        // invalid points for a circle
        $this->putJson("api/v1/annotations/{$id}", ['shape_id' => Shape::circleId()])
            ->assertStatus(422);

        $this->putJson("api/v1/annotations/{$id}", [
                'shape_id' => Shape::circleId(),
                'points' => [100, 200, 300],
            ])
            ->assertStatus(200);

        $this->annotation->refresh();
        $this->assertEquals(Shape::circleId(), $this->annotation->shape_id);
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
