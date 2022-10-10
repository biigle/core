<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Video;
use Illuminate\Http\File;
use Queue;
use Storage;

class VideoControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $video = VideoTest::create([
            'volume_id' => $this->volume()->id,
            'duration' => 123,
            'attrs' => [
                'size' => 321,
                'mimetype' => 'video/mp4',
            ],
        ]);
        $id = $video->id;

        $this->doTestApiRoute('GET', "/api/v1/videos/{$id}");

        $this->beUser();
        $this->get("/api/v1/videos/{$id}")->assertStatus(403);

        $this->beGuest();
        $this->getJson("/api/v1/videos/{$id}")
            ->assertStatus(200)
            ->assertExactJson([
                'id' => $video->id,
                'uuid' => $video->uuid,
                'filename' => $video->filename,
                'volume_id' => $video->volume_id,
                'size' => $video->size,
                'mimeType' => $video->mimeType,
                'duration' => $video->duration,
                'error' => null,
                'taken_at' => null,
                'lat' => null,
                'lng' => null,
            ]);
    }

    public function testShowSizeNull()
    {
        $video = VideoTest::create([
            'volume_id' => $this->volume()->id,
            'duration' => 123,
            'attrs' => [
                'mimetype' => 'video/mp4',
            ],
        ]);
        $id = $video->id;

        $this->beGuest();
        $this->getJson("/api/v1/videos/{$id}")
            ->assertStatus(200)
            ->assertExactJson([
                'id' => $video->id,
                'uuid' => $video->uuid,
                'filename' => $video->filename,
                'volume_id' => $video->volume_id,
                'size' => null,
                'mimeType' => $video->mimeType,
                'duration' => $video->duration,
                'error' => null,
                'taken_at' => null,
                'lat' => null,
                'lng' => null,
            ]);
    }

    public function testShowError()
    {
        $video = VideoTest::create([
            'volume_id' => $this->volume()->id,
            'duration' => 123,
            'attrs' => [
                'mimetype' => 'video/mp4',
                'error' => Video::ERROR_NOT_FOUND,
            ],
        ]);
        $id = $video->id;

        $this->beGuest();
        $this->getJson("/api/v1/videos/{$id}")
            ->assertStatus(200)
            ->assertExactJson([
                'id' => $video->id,
                'uuid' => $video->uuid,
                'filename' => $video->filename,
                'volume_id' => $video->volume_id,
                'size' => null,
                'mimeType' => $video->mimeType,
                'duration' => $video->duration,
                'error' => Video::ERROR_NOT_FOUND,
                'taken_at' => null,
                'lat' => null,
                'lng' => null,
            ]);
    }

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
