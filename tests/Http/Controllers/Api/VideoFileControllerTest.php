<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use Storage;
use Biigle\Tests\TestCase;
use Biigle\Modules\Videos\Video;

class VideoFileControllerTest extends TestCase
{
    public function testShow()
    {
        $video = factory(Video::class)->create();
        Storage::fake('videos');
        Storage::disk('videos')->put($video->uuid, 'testvideo');

        $this->get('api/v1/videos/foo/file')->assertStatus(404);
        $this->get("api/v1/videos/{$video->uuid}/file")->assertStatus(200);
    }

    public function testShowPartial()
    {
        $video = factory(Video::class)->create(['meta' => ['size' => 9]]);
        Storage::fake('videos');
        Storage::disk('videos')->put($video->uuid, 'testvideo');

        $response = $this->withHeaders(['Range' => 'bytes=3-'])
            ->getJson("api/v1/videos/{$video->uuid}/file")
            ->assertStatus(206);

        $this->assertEquals(6, $response->headers->get('Content-Length'));
        $this->assertTrue($response->headers->has('Content-Range'));
        $this->assertEquals('bytes 3-8/9', $response->headers->get('Content-Range'));
    }
}
