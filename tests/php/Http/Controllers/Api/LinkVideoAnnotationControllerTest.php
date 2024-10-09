<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;

class LinkVideoAnnotationControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create(['volume_id' => $id]);
    }

    public function testStoreValidation()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [2.0, 4.0],
            'points' => [[30, 30], [40, 40]],
        ]);

        $this->doTestApiRoute('POST', "api/v1/video-annotations/{$a1->id}/link");

        $this->beUser();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => 0,
            ])
            // Second annotation ID must exist.
            ->assertStatus(404);

        $a2->update(['video_id' => VideoTest::create()->id]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // Other annotation must belong to the same video.
            ->assertStatus(422);

        $a2->update(['video_id' => $this->video->id, 'shape_id' => Shape::circleId()]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // The shapes must match.
            ->assertStatus(422);

        $a2->update(['shape_id' => Shape::pointId()]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $a1->id]);

        $this->assertSame(1, $this->video->annotations()->count());
        $this->assertNull($a2->fresh());
    }

    public function testStoreValidateOverlap()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.5, 2.5],
            'points' => [[30, 30], [40, 40]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 1.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.25, 1.75]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 2.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [0.5, 2.0]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.0, 2.5]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);

        $a2->update(['frames' => [1.0, 2.0]]);
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(422);
    }

    public function testStoreBefore()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [3.0, 4.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[30, 30], [40, 40]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, null, 3, 4], $a1->frames);
        $this->assertSame([[30, 30], [40, 40], [], [10, 10], [20, 20]], $a1->points);
    }

    public function testStoreAfter()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [3.0, 4.0],
            'points' => [[30, 30], [40, 40]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, null, 3, 4], $a1->frames);
        $this->assertSame([[10, 10], [20, 20], [], [30, 30], [40, 40]], $a1->points);
    }

    public function testStoreMergeLabels()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 10]],
        ]);

        $l1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [2.0],
            'points' => [[20, 20]],
        ]);

        $l2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
        ]);

        $l3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $l1->user_id,
        ]);

        $l4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'label_id' => $l1->label_id,
            'user_id' => $l1->user_id,
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $this->assertSame(3, $a1->labels()->count());
        $this->assertNotNull($l1->fresh());
        $this->assertSame($a1->id, $l2->fresh()->annotation_id);
        $this->assertSame($a1->id, $l3->fresh()->annotation_id);
        $this->assertNull($l4->fresh());
    }

    public function testStoreTouching()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0, 2.0],
            'points' => [[10, 10], [20, 20]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [2.09, 3.0],
            'points' => [[30, 30], [40, 40]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, 2, 3], $a1->frames);
        $this->assertSame([[10, 10], [20, 20], [40, 40]], $a1->points);
    }

    public function testStoreSingleFrameTouching()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 10]],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[30, 30]],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            // This is the same than overlapping times of an annotation clip.
            ->assertStatus(422);
    }

    public function testStoreWholeFrame()
    {
        $a1 = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [],
        ]);

        $a2 = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [2.0],
            'points' => [],
        ]);

        $this->beEditor();
        $this
            ->postJson("api/v1/video-annotations/{$a1->id}/link", [
                'annotation_id' => $a2->id,
            ])
            ->assertStatus(200);

        $a1->refresh();
        $this->assertSame([1, null, 2], $a1->frames);
        $this->assertEmpty($a1->points);
    }
}
