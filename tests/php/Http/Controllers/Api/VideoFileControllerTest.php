<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\VideoTest;
use Storage;

class VideoFileControllerTest extends ApiTestCase
{
    public function testShow()
    {
        Storage::fake('test');
        Storage::disk('test')->put('video.mp4', 'testvideo');
        $video = VideoTest::create([
            'url' => 'test://video.mp4',
            'project_id' => $this->project()->id,
        ]);

        $this->doTestApiRoute('GET', "api/v1/videos/{$video->id}/file");

        $this->beUser();
        $this->get('api/v1/videos/foo/file')->assertStatus(404);
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(403);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(200);
    }

    public function testShowNotFound()
    {
        Storage::fake('test');
        $video = VideoTest::create([
            'url' => 'test://video.mp4',
            'project_id' => $this->project()->id,
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertStatus(404);
    }

    public function testShowPartial()
    {
        Storage::fake('test');
        Storage::disk('test')->put('video.mp4', 'testvideo');
        $video = VideoTest::create([
            'url' => 'test://video.mp4',
            'project_id' => $this->project()->id,
            'attrs' => ['size' => 9],
        ]);

        $this->beGuest();
        $response = $this->withHeaders(['Range' => 'bytes=3-'])
            ->getJson("api/v1/videos/{$video->id}/file")
            ->assertStatus(206);

        $this->assertEquals(6, $response->headers->get('Content-Length'));
        $this->assertTrue($response->headers->has('Content-Range'));
        $this->assertEquals('bytes 3-8/9', $response->headers->get('Content-Range'));
    }

    public function testShowRemote()
    {
        $video = VideoTest::create([
            'url' => 'https://domain.tdl/video.mp4',
            'project_id' => $this->project()->id,
        ]);

        $this->beGuest();
        $this->get("api/v1/videos/{$video->id}/file")->assertRedirect($video->url);
    }
}
