<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

class SplitVideoAnnotationControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create(['volume_id' => $id]);
    }

    public function testStore()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $label = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$annotation->id}/split");

        $this->beUser();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split")
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 0.5,
            ])
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.0,
            ])
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 2.0,
            ])
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 2.5,
            ])
            ->assertStatus(422);

        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200);

        $this->assertEquals(2, $this->video->annotations()->count());
        $this->video->annotations->each(function ($annotation) use ($label) {
            $compare = $annotation->labels()->first();
            $this->assertEquals($label->label_id, $compare->label_id);
            $this->assertEquals($label->user_id, $compare->user_id);
        });
    }

    public function testStorePoint()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['points' => [[10, 10], [15, 15]]])
            ->assertJsonFragment(['frames' => [1.5, 2.0]])
            ->assertJsonFragment(['points' => [[15, 15], [20, 20]]]);
    }

    public function testStoreRectangle()
    {
        $points = [
            [0, 0, 10, 0, 10, 10, 0, 10],
            [10, 0, 20, 0, 20, 10, 10, 10],
        ];

        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => $points,
        ]);

        $expect = [5, 0, 15, 0, 15, 10, 5, 10];

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['points' => [$points[0], $expect]])
            ->assertJsonFragment(['frames' => [1.5, 2.0]])
            ->assertJsonFragment(['points' => [$expect, $points[1]]]);
    }

    public function testStoreCircle()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10, 5], [20, 20, 10]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['points' => [[10, 10, 5], [15, 15, 7.5]]])
            ->assertJsonFragment(['frames' => [1.5, 2.0]])
            ->assertJsonFragment(['points' => [[15, 15, 7.5], [20, 20, 10]]]);
    }

    public function testStoreLineString()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::lineId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10, 20, 20], [20, 20, 10, 10]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            // Line strings cannot be split because the interpolation is not implemented.
            ->assertStatus(422);
    }

    public function testStorePolygon()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::polygonId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10, 20, 20, 30, 30], [30, 30, 20, 20, 10, 10]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            // Polygons cannot be split because the interpolation is not implemented.
            ->assertStatus(422);
    }

    public function testStoreWholeFrame()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['points' => []])
            ->assertJsonFragment(['frames' => [1.5, 2.0]]);
    }

    public function testStorePointAtGap()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, null, 2.0],
            'points' => [[10, 10], [], [20, 20]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0]])
            ->assertJsonFragment(['points' => [[10, 10]]])
            ->assertJsonFragment(['frames' => [2.0]])
            ->assertJsonFragment(['points' => [[20, 20]]]);
    }

    public function testStorePointAtFrame()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 1.5, 2.0],
            'points' => [[10, 10], [15, 15], [20, 20]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['points' => [[10, 10], [15, 15]]])
            ->assertJsonFragment(['frames' => [1.5, 2.0]])
            ->assertJsonFragment(['points' => [[15, 15], [20, 20]]]);
    }

    public function testStoreWholeFrameAtFrame()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 1.5, 2.0],
            'points' => [],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$annotation->id}/split", [
                'time' => 1.5,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0, 1.5]])
            ->assertJsonFragment(['frames' => [1.5, 2.0]])
            ->assertJsonFragment(['points' => []]);
    }
}
