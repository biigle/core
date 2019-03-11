<?php

namespace Biigle\Tests\Modules\Videos\Jobs;

use Storage;
use TestCase;
use FileCache;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Videos\Jobs\ProcessNewVideo;

class ProcessNewVideoTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('video-thumbs');
        FileCache::fake();
        config(['videos.thumbnail_count' => 3]);
        $video = VideoTest::create();
        $job = new ProcessNewVideoStub($video);
        $job->duration = 10;

        $job->handle();
        $this->assertEquals(10, $video->fresh()->duration);
        $this->assertEquals([0, 5, 9], $job->times);

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));
    }
}

class ProcessNewVideoStub extends ProcessNewVideo
{
    public $duration;
    public $times = [];

    protected function getVideoDuration($path)
    {
        return $this->duration;
    }

    protected function generateVideoThumbnail($path, $time, $width, $height, $format)
    {
        $this->times[] = $time;

        return 'content';
    }
}
