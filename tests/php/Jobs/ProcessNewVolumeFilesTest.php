<?php

namespace Biigle\Tests\Jobs;

use Queue;
use Storage;
use TestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\ProcessNewImage;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Jobs\CloneImageThumbnails;
use Biigle\Jobs\ProcessNewVolumeFiles;

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

    public function testHandleTiledImageWithThumbnails()
    {
        $diskThumbs = Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);

        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $prefix = fragment_uuid_path($i1->uuid);

        $copy = VolumeTest::create();
        $i2 = ImageTest::create(['volume_id' => $copy->id, 'filename' => 'a.jpg']);
        $copyPrefix = fragment_uuid_path($i2->uuid);

        $diskThumbs->put($prefix.'/thumb.jpg','');
        $diskTiles->put($prefix.'/tile.jpg', '');

        $map = [$i2->uuid => $i1->uuid];

        Queue::fake();
        
        with(new ProcessNewVolumeFiles($copy,[],$map))->handle();

        Queue::assertPushed(CloneImageThumbnails::class, fn ($job) => $job->prefix === $prefix && $job->copyPrefix === $copyPrefix);
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
