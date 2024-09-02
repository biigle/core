<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class ImageAnnotationBulkControllerTest extends ApiTestCase
{
    private $annotation;

    public function setUp(): void
    {
        parent::setUp();
        $this->annotation = ImageAnnotationTest::create();
        $this->project()->volumes()->attach($this->annotation->image->volume_id);
    }

    public function testStore()
    {
        $this->store('api/v1/image-annotations');
    }

    public function testStoreLegacy()
    {
        $this->store('api/v1/annotations');
    }

    public function store($url)
    {
        $this->doTestApiRoute('POST', $url);

        $image = ImageTest::create();
        $this->beUser();
        $this
            ->postJson($url, [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson($url, [[
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(403);

        $this
            ->postJson($url, [
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

        $this
            ->postJson($url, [
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

        $this->assertSame(3, $this->annotation->image->annotations()->count());
        $annotation = $this->annotation->image->annotations()->orderBy('id', 'desc')->first();
        $this->assertSame(Shape::pointId(), $annotation->shape_id);
        $this->assertSame([100, 100], $annotation->points);
        $this->assertSame(1, $annotation->labels()->count());
        $this->assertSame($this->labelRoot()->id, $annotation->labels()->first()->label_id);
    }

    public function testStoreValidation()
    {
        $this->storeValidation('api/v1/image-annotations');
    }

    public function testStoreValidationLegacy()
    {
        $this->storeValidation('api/v1/annotations');
    }

    public function storeValidation($url)
    {
        $this->beEditor();
        $this
            ->postJson($url, [[
                'image_id' => 999,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => 999,
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => 999,
                'confidence' => 1.0,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [
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

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 999,
            ]])
            ->assertStatus(422);

        $this->assertSame(1, $this->annotation->image->annotations()->count());

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id + 0.9,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id,
                'confidence' => 999,
            ]])
            ->assertStatus(422);

        $this
            ->postJson($url, [[
                'image_id' => $this->annotation->image_id,
                'shape_id' => Shape::pointId(),
                'points' => [100, 100],
                'label_id' => $this->labelRoot()->id + 0.9,
                'confidence' => 999,
            ]])
            ->assertStatus(422);
    }

    public function testStoreLimit()
    {
        $this->storeLimit('api/v1/image-annotations');
    }

    public function testStoreLimitLegacy()
    {
        $this->storeLimit('api/v1/annotations');
    }

    public function storeLimit($url)
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
        $this->postJson($url, $data)
            ->assertStatus(422);
    }

    public function testStoreLabelIdIsString()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => strval($this->labelRoot()->id),
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(200);

        $this->assertSame(2, $this->annotation->image->annotations()->count());
    }

    public function testStoreLabelIdIsFloat()
    {
        $this->beEditor();
        $this
            ->postJson('api/v1/annotations', [
                [
                    'image_id' => $this->annotation->image_id,
                    'shape_id' => Shape::pointId(),
                    'points' => [100, 100],
                    'label_id' => 1.5,
                    'confidence' => 1.0,
                ],
            ])
            ->assertStatus(422);
    }
}
