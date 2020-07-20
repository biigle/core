<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Illuminate\Http\File;
use Queue;
use Storage;

class VideoControllerTest extends ApiTestCase
{
    public function testDestroy()
    {
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $id = $video->id;

        $this->doTestApiRoute('DELETE', "/api/v1/videos/{$id}");

        $this->beEditor();
        $this->delete("/api/v1/videos/{$id}")->assertStatus(403);

        $this->beAdmin();
        $this->deleteJson("/api/v1/videos/{$id}")->assertStatus(200);
        $this->assertNull($video->fresh());
    }

    public function testDestroyForce()
    {
        $video = VideoTest::create(['volume_id' => $this->volume()->id]);
        $id = $video->id;
        $annotation = VideoAnnotationTest::create(['video_id' => $id]);

        $this->beAdmin();
        $this->deleteJson("/api/v1/videos/{$id}")->assertStatus(422);
        $this->assertNotNull($video->fresh());
        $this->assertNotNull($annotation->fresh());

        $this->deleteJson("/api/v1/videos/{$id}", ['force' => true])->assertStatus(200);
        $this->assertNull($video->fresh());
        $this->assertNull($annotation->fresh());
    }
}
