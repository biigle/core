<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\TrackObject;
use Biigle\MediaType;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Cache;
use Carbon\Carbon;
use Queue;

class VideoAnnotationControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->video = VideoTest::create([
            'volume_id' => $id,
            'duration' => 2,
        ]);
    }

    public function testIndex()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
        ]);

        $label = LabelTest::create([
            'name' => 'My label',
            'color' => 'bada55',
        ]);

        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/videos/{$this->video->id}/annotations");

        $this->beUser();
        $this
            ->getJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(403);

        $this->beGuest();
        $this
            ->getJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0]])
            ->assertJsonFragment(['points' => [[10, 20]]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label']);
    }

    public function testIndexAnnotationSessionHideOwn()
    {
        $session = AnnotationSessionTest::create([
            'volume_id' => $this->volume()->id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'created_at' => Carbon::yesterday(),
            'points' => [[10, 20]],
        ]);

        $al1 = VideoAnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'created_at' => Carbon::today(),
            'points' => [[20, 30]],
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'user_id' => $this->editor()->id,
            'annotation_id' => $a2->id,
        ]);

        $this->beEditor();
        $this
            ->get("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(200)
            ->assertJsonFragment(['points' => [[10, 20]]])
            ->assertJsonFragment(['points' => [[20, 30]]]);

        $session->users()->attach($this->editor());
        Cache::flush();

        $this
            ->get("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(200)
            ->assertJsonMissing(['points' => [[10, 20]]])
            ->assertJsonFragment(['points' => [[20, 30]]]);
    }

    public function testShow()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
        ]);

        $label = LabelTest::create([
            'name' => 'My label',
            'color' => 'bada55',
        ]);

        VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/video-annotations/{$annotation->id}");

        $this->beUser();
        $this
            ->getJson("/api/v1/video-annotations/{$annotation->id}")
            ->assertStatus(403);

        $this->beGuest();
        $this
            ->getJson("/api/v1/video-annotations/{$annotation->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['frames' => [1.0]])
            ->assertJsonFragment(['points' => [[10, 20]]])
            ->assertJsonFragment(['color' => 'bada55'])
            ->assertJsonFragment(['name' => 'My label']);
    }

    public function showAnnotationSession()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
            'created_at' => Carbon::yesterday(),
        ]);

        $session = AnnotationSessionTest::create([
            'volume_id' => $this->annotation->video->volume_id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $this->beAdmin();
        $this
            ->get("/api/v1/video-annotations/{$this->annotation->id}")
            ->assertStatus(200);

        $session->users()->attach($this->admin());
        Cache::flush();

        $this
            ->get("/api/v1/video-annotations/{$this->annotation->id}")
            ->assertStatus(403);
    }

    public function testStore()
    {
        $label = LabelTest::create();
        $this->doTestApiRoute('POST', "/api/v1/videos/{$this->video->id}/annotations");

        $this->beGuest();
        $this->post("/api/v1/videos/{$this->video->id}/annotations")->assertStatus(403);

        $this->beEditor();
        // missing arguments
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations")
            ->assertStatus(422);

        // shape does not exist
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => 99999,
                'label_id' => $label->id,
                'points' => [],
                'frames' => [],
            ])
            ->assertStatus(422);

        // points is required
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $label->id,
                'frames' => [],
            ])
            ->assertStatus(422);

        // frames is required
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $label->id,
                'points' => [],
            ])
            ->assertStatus(422);

        // at least one point required
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [],
                'frames' => [],
            ])
            ->assertStatus(422);

        // number of points and frames does not match
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[0, 0]],
                'frames' => [0.0, 1.0],
            ])
            ->assertStatus(422);

        // label does not belong to a label tree of the project of the video
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[0, 0]],
                'frames' => [0.0],
            ])
            ->assertStatus(403);

        $this->project()->labelTrees()->attach($label->label_tree_id);
        // policies are cached
        Cache::flush();

        // shape is invalid
        $this
            ->json('POST', "/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::rectangleId(),
                'label_id' => $label->id,
                'frames' => [1],
                'points' => [[844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]],
            ])->assertStatus(422);

        // shape is invalid
        $this
            ->json('POST', "/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $label->id,
                'frames' => [1],
                'points' => [[844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]],
            ])->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $label->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
            ])
            ->assertSuccessful()
            ->assertJsonFragment(['frames' => [0.0]])
            ->assertJsonFragment(['points' => [[10, 11]]])
            ->assertJsonFragment(['name' => $label->name])
            ->assertJsonFragment(['color' => $label->color]);

        $annotation = $this->video->annotations()->first();
        $this->assertNotNull($annotation);
        $this->assertEquals([[10, 11]], $annotation->points);
        $this->assertEquals([0.0], $annotation->frames);
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreValidatePoints()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13]],
                'frames' => [0.0],
            ])
            ->assertStatus(422);
    }

    public function testStoreValidatePointsArray()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [null],
                'frames' => [0.0],
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateFrames()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => 1234,
            ])
            ->assertStatus(422);
    }

    public function testStoreAndTrackPoint()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0, 1.0],
                'track' => true,
            ])
            // Not a single frame annotation.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11], [20, 21]],
                'frames' => [0.0],
                'track' => true,
            ])
            // Still not a single frame annotation.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => 'whatever',
            ])
            // Track must be bool.
            ->assertStatus(422);

        Queue::fake();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();
        Queue::assertPushedOn('high', TrackObject::class);
    }

    public function testStoreAndTrackRectangle()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::rectangleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13]],
                'frames' => [0.0],
                'track' => true,
            ])
            // Rectangles cannot be tracked.
            ->assertStatus(422);
    }

    public function testStoreAndTrackCircle()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::circleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();
    }

    public function testStoreAndTrackLineString()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::lineId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13]],
                'frames' => [0.0],
                'track' => true,
            ])
            // Line strings cannot be tracked.
            ->assertStatus(422);
    }

    public function testStoreAndTrackPolygon()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::polygonId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13, 14, 15]],
                'frames' => [0.0],
                'track' => true,
            ])
            // Polygons cannot be tracked.
            ->assertStatus(422);
    }

    public function testStoreAndTrackPointOutsideBoundary()
    {
        config(['videos.tracking_point_padding' => 10]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[0, 0]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();

        $this->video->width = 100;
        $this->video->height = 100;
        $this->video->save();

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[0, 0]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[100, 100]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[90, 90]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();
    }

    public function testStoreAndTrackCircleOutsideBoundary()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::circleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[0, 0, 10]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();

        $this->video->width = 100;
        $this->video->height = 100;
        $this->video->save();

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::circleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[0, 0, 10]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::circleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[100, 100, 10]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::circleId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[90, 90, 10]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();
    }

    public function testStoreAndTrackIncrementRateLimit()
    {
        Queue::fake();
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertSuccessful();

        $this->assertEquals(1, Cache::get(TrackObject::getRateLimitCacheKey($this->editor())));
    }

    public function testStoreAndTrackRestrictRateLimit()
    {
        config(['videos.track_object_max_jobs_per_user' => 3]);
        Cache::put(TrackObject::getRateLimitCacheKey($this->editor()), 3);
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => true,
            ])
            ->assertStatus(429);

    }

    public function testTrackingJobLimit()
    {
        Queue::fake();
        $this->beEditor();
        $res = $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => true,
            ])->assertSuccessful();

        $this->assertEquals(1, Cache::get(TrackObject::getRateLimitCacheKey($this->editor())));
        $this->assertFalse($res->json()['trackingJobLimitReached']);

        Cache::set(TrackObject::getRateLimitCacheKey($this->editor()), 9);
        $res = $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::pointId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11]],
                'frames' => [0.0],
                'track' => true,
            ])->assertSuccessful();
        
        $this->assertEquals(10, Cache::get(TrackObject::getRateLimitCacheKey($this->editor())));
        $this->assertTrue($res->json()['trackingJobLimitReached']);
    }

    public function testStoreWholeFrameAnnotation()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[0, 0], [1, 1]],
                'frames' => [0.0, 1.5],
            ])
            // Points must be empty.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [],
                'frames' => [0.0, 1.5, 3.0],
            ])
            // No more than two frames for a new whole frame annotation.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'frames' => [0.0, 1.5],
            ])
            ->assertStatus(201);

        $annotation = $this->video->annotations()->first();
        $this->assertNotNull($annotation);
        $this->assertEquals([], $annotation->points);
        $this->assertEquals([0.0, 1.5], $annotation->frames);
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreWholeFrameSingleFrameAnnotation()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'frames' => [0.0],
            ])
            ->assertStatus(201);

        $annotation = $this->video->annotations()->first();
        $this->assertNotNull($annotation);
        $this->assertEquals([], $annotation->points);
        $this->assertEquals([0.0], $annotation->frames);
        $this->assertEquals(1, $annotation->labels()->count());
    }

    public function testStoreAndTrackWholeFrameAnnotation()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'points' => [[10, 11, 12, 13, 14, 15]],
                'frames' => [0.0],
                'track' => true,
            ])
            // Whole frame anotations cannot be tracked.
            ->assertStatus(422);
    }

    public function testStoreInvalidKeyFrames()
    {
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'frames' => [-1, 1.5],
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'frames' => [0, 2.5],
            ])
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/videos/{$this->video->id}/annotations", [
                'shape_id' => Shape::wholeFrameId(),
                'label_id' => $this->labelRoot()->id,
                'frames' => [0, 2.0],
            ])
            ->assertStatus(201);
    }

    public function testUpdate()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
        ]);

        $this->doTestApiRoute('PUT', "api/v1/video-annotations/{$annotation->id}");

        $this->beUser();
        $this
            ->putJson("api/v1/video-annotations/{$annotation->id}")->assertStatus(403);

        $this->beAdmin();
        $this
            ->putJson("api/v1/video-annotations/{$annotation->id}", [
                'points' => [[10, 20], [30, 40]],
                'frames' => [1.0, 10.0]
            ])
            ->assertStatus(200);

        $annotation = $annotation->fresh();
        $this->assertEquals([[10, 20], [30, 40]], $annotation->points);
        $this->assertEquals([1.0, 10.0], $annotation->frames);
    }

    public function testUpdateValidatePoints()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [[10, 20]],
        ]);

        $this->beAdmin();
        // invalid number of points
        $this
            ->putJson("api/v1/video-annotations/{$annotation->id}", [
                'points' => [[10, 15, 20]],
            ])
            ->assertStatus(422);
    }

    public function testUpdateInvalidPoints()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::rectangleId(),
            'video_id' => $this->video->id,
            'frames' => [0],
            'points' => [[0, 1, 2, 3, 4, 5, 6, 7]],
        ]);

        $this->beAdmin();

        $this->putJson("api/v1/video-annotations/{$annotation->id}", ['points' => [[844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]]])
            ->assertStatus(422);

        $annotation->points = [[0, 1, 2, 3, 4, 5, 6, 7]];
        $annotation->shape_id = Shape::lineId();
        $annotation->save();

        $this->putJson("api/v1/video-annotations/{$annotation->id}", ['points' => [[844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44, 844.69, 1028.44]]])
            ->assertStatus(422);

    }

    public function testUpdateWholeFrameAnnotation()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $this->video->id,
            'frames' => [1.0],
            'points' => [],
        ]);

        $this->beAdmin();
        $this
            ->putJson("api/v1/video-annotations/{$annotation->id}", [
                'frames' => [1.0, 2.0, null, 3.0, 4.0],
            ])
            ->assertStatus(200);

        $annotation = $annotation->fresh();
        $this->assertEquals([1.0, 2.0, null, 3.0, 4.0], $annotation->frames);
    }

    public function testDestroy()
    {
        $annotation = VideoAnnotationTest::create([
            'video_id' => $this->video->id,
        ]);

        $this->doTestApiRoute('DELETE', "api/v1/video-annotations/{$annotation->id}");

        $this->beUser();
        $this->delete("api/v1/video-annotations/{$annotation->id}")->assertStatus(403);

        $this->assertNotNull($annotation->fresh());

        $this->beUser();
        $response = $this->delete("api/v1/video-annotations/{$annotation->id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("api/v1/video-annotations/{$annotation->id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("api/v1/video-annotations/{$annotation->id}");
        $response->assertStatus(200);

        $this->assertNull($annotation->fresh());

        // admin could delete but the annotation was already deleted
        $this->beAdmin();
        $response = $this->delete("api/v1/video-annotations/{$annotation->id}");
        $response->assertStatus(404);
    }
}
