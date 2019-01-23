<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use Queue;
use ApiTestCase;
use Biigle\Shape;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Videos\Jobs\TrackObject;
use Biigle\Tests\Modules\Videos\VideoAnnotationTest;

class TrackAnnotationControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['project_id' => $this->project()->id]),
        ]);
        $id = $annotation->id;

        $this->doTestApiRoute('POST', "/api/v1/video-annotations/{$id}/track");

        $this->beGuest();
        $this->post("/api/v1/video-annotations/{$id}/track")->assertStatus(403);

        $this->beEditor();
        Queue::fake();
        $this->postJson("/api/v1/video-annotations/{$id}/track")->assertStatus(200);
        Queue::assertPushed(TrackObject::class);
    }

    public function testStoreClip()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0, 1],
            'points' => [[0, 0], [10, 10]],
            'video_id' => VideoTest::create(['project_id' => $this->project()->id]),
        ]);
        $id = $annotation->id;

        $this->beEditor();
        $this->postJson("/api/v1/video-annotations/{$id}/track")->assertStatus(422);
    }

    public function testStoreShape()
    {
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::circleId(),
            'frames' => [0],
            'points' => [[0, 0, 10]],
            'video_id' => VideoTest::create(['project_id' => $this->project()->id]),
        ]);
        $id = $annotation->id;

        $this->beEditor();
        $this->postJson("/api/v1/video-annotations/{$id}/track")->assertStatus(422);
    }
}
