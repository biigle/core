<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\VideoTest;
use Mockery;
use Storage;

class VideoFileControllerTest extends ApiTestCase
{
    public function testShow()
    {
        // Use persistent fake because it does not support temporary URLs.
        $disk = Storage::persistentFake('test');
        $disk->put('files/video.mp4', 'testvideo');
        try {
            $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
            $video = VideoTest::create([
                'filename' => 'video.mp4',
                'volume_id' => $id,
                'attrs' => ['size' => 9],
            ]);

            $this->doTestApiRoute('GET', "api/v1/videos/{$video->id}/file");

            $this->beUser();
            $this->get('api/v1/videos/foo/file')->assertStatus(404);
            $this->get("api/v1/videos/{$video->id}/file")->assertStatus(403);

            $this->beGuest();
            $this->get("api/v1/videos/{$video->id}/file")->assertStatus(200);
        } finally {
            $disk->deleteDirectory('files');
        }
    }

    public function testShowNotFound()
    {
        // Use persistent fake because it does not support temporary URLs.
        $disk = Storage::persistentFake('test');
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $video = VideoTest::create([
            'filename' => 'video.mp4',
            'volume_id' => $id,
            'attrs' => ['size' => 9],
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(404);
    }

    public function testShowPartial()
    {
        // Use persistent fake because it does not support temporary URLs.
        $disk = Storage::persistentFake('test');
        $disk->put('files/video.mp4', 'testvideo');
        try {
            $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
            $video = VideoTest::create([
                'filename' => 'video.mp4',
                'volume_id' => $id,
                'attrs' => ['size' => 9],
            ]);

            $this->beGuest();
            $response = $this->withHeaders(['Range' => 'bytes=3-'])
                ->getJson("api/v1/videos/{$video->id}/file")
                ->assertStatus(206);

            $this->assertSame(6, intval($response->headers->get('Content-Length')));
            $this->assertTrue($response->headers->has('Content-Range'));
            $this->assertSame('bytes 3-8/9', $response->headers->get('Content-Range'));
        } finally {
            $disk->deleteDirectory('files');
        }
    }

    public function testShowRemote()
    {
        $id = $this->volume([
            'media_type_id' => MediaType::videoId(),
            'url' => 'https://domain.tld',
        ])->id;
        $video = VideoTest::create([
            'filename' => 'video.mp4',
            'volume_id' => $id,
            'attrs' => ['size' => 9],
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertRedirect($video->url);
    }

    public function testShowTempUrl()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $video = VideoTest::create([
            'filename' => 'video.mp4',
            'volume_id' => $id,
            'attrs' => ['size' => 9],
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('providesTemporaryUrls')->once()->andReturn(true);
        $mock->shouldReceive('temporaryUrl')->once()->andReturn('myurl');
        Storage::shouldReceive('disk')->andReturn($mock);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")
            ->assertRedirect('myurl');
    }

    public function testShowNotProcessed()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $video = VideoTest::create([
            'filename' => 'video.mp4',
            'volume_id' => $id,
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(428);
    }

    public function testShowDiskNotFound()
    {
        $id = $this->volume([
            'url' => 'abcd://videos',
            'media_type_id' => MediaType::videoId(),
        ])->id;
        $video = VideoTest::create([
            'filename' => 'video.mp4',
            'volume_id' => $id,
            'attrs' => ['size' => 9],
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(404);
    }
}
