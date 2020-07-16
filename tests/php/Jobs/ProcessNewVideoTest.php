<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoTest;
use FileCache;
use Storage;
use TestCase;

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
        $this->assertEquals([0.5, 5, 9.5], $job->times);

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));
    }

    public function testHandleMimeType()
    {
        // Take MIME detection from VideoUrl validator/ProjectVideoController
        $this->markTestIncomplete('Show a warning that the video is being processed if the mimetype is not yet set.');
    }

    public function testHandleSize()
    {
        // Take code from ProjectVideoController
        $this->markTestIncomplete('Show a warning that the video is being processed if the size is not yet set.');
    }

    public function testHandleInvalidMimeType()
    {
        // Take MIME detection from VideoUrl validator.
        $this->markTestIncomplete('Dont process the video and set an error flag in the attrs which causes an error to be displayed in the video annotation tool.');
    }

    public function testHandleInvalidCodec()
    {
        // Take codec detection from VideoUrl validator.
        $this->markTestIncomplete('Dont process the video and set an error flag in the attrs which causes an error to be displayed in the video annotation tool.');
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
