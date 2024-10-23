<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\ProcessNewImage;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Queue;
use TestCase;

class ProcessNewVolumeFilesTest extends TestCase
{
    public function testHandleImages()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        Queue::fake();

        with(new ProcessNewVolumeFiles($volume))->handle();

        Queue::assertPushed(ProcessNewImage::class, fn ($job) => $job->image->id === $i1->id);

        Queue::assertPushed(ProcessNewImage::class, fn ($job) => $job->image->id === $i2->id);
    }

    public function testHandleImagesWithOnly()
    {
        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);

        Queue::fake();

        with(new ProcessNewVolumeFiles($volume, [$i1->id]))->handle();

        Queue::assertPushed(ProcessNewImage::class, fn ($job) => $job->image->id === $i1->id);

        Queue::assertNotPushed(ProcessNewImage::class, fn ($job) => $job->image->id === $i2->id);
    }

    public function testHandleVideos()
    {
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.mp4']);
        $v2 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'b.mp4']);

        Queue::fake();

        with(new ProcessNewVolumeFiles($volume))->handle();

        Queue::assertPushed(ProcessNewVideo::class, fn ($job) => $job->video->id === $v1->id);

        Queue::assertPushed(ProcessNewVideo::class, fn ($job) => $job->video->id === $v2->id);
    }

    public function testHandleVideosWithOnly()
    {
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.mp4']);
        $v2 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'b.mp4']);

        Queue::fake();

        with(new ProcessNewVolumeFiles($volume, [$v1->id]))->handle();

        Queue::assertPushed(ProcessNewVideo::class, fn ($job) => $job->video->id === $v1->id);

        Queue::assertNotPushed(ProcessNewVideo::class, fn ($job) => $job->video->id === $v2->id);
    }

    public function testHandleVideosQueue()
    {
        config(['videos.process_new_video_queue' => 'low']);
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.mp4']);

        Queue::fake();
        with(new ProcessNewVolumeFiles($volume))->handle();

        Queue::assertPushedOn('low', ProcessNewVideo::class, fn ($job) => $job->video->id === $v1->id);
    }
}
