<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationTest;

class VideoControllerTest extends ApiTestCase
{
    public function testDestroy()
    {
        $video = VideoTest::create(['project_id' => $this->project()->id]);
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
        $video = VideoTest::create(['project_id' => $this->project()->id]);
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
