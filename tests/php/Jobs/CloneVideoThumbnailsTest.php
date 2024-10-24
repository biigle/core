<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CloneVideoThumbnails;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoTest;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use TestCase;

class CloneVideoThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);
        
        $disk = Storage::fake('test-thumbs');

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        $copyVideo = VideoTest::create();
        $copyPrefix = fragment_uuid_path($copyVideo->uuid);

        $v1 = '/0.jpg';
        $v2 = '/sprite_0.webp';

        $p1 = $prefix.$v1;
        $p2 = $prefix.$v2;

        $disk->put($p1, '');
        $disk->put($p2, '');

        $this->assertFileExists($disk->path($p1));
        $this->assertFileExists($disk->path($p2));

        Queue::fake();
        with(new CloneVideoThumbnails($copyVideo, $prefix))->handle();
        Queue::assertNotPushed(ProcessNewVideo::class);

        $this->assertFileExists($disk->path($copyPrefix.$v1));
        $this->assertFileExists($disk->path($copyPrefix.$v2));
    }

    public function testHandleMissingData()
    {
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);
        Storage::fake('test-thumbs');

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        $copyVideo = VideoTest::create();

        Queue::fake();
        with(new CloneVideoThumbnails($copyVideo, $prefix))->handle();
        Queue::assertPushed(ProcessNewVideo::class);
    }

    public function testHandleMissingThumbnails()
    {
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);
        
        $disk = Storage::fake('test-thumbs');

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        $copyVideo = VideoTest::create();
        $v2 = '/sprite_0.webp';

        $p2 = $prefix.$v2;
        $disk->put($p2, '');

        $this->assertFileExists($disk->path($p2));

        Queue::fake();
        with(new CloneVideoThumbnails($copyVideo, $prefix))->handle();
        Queue::assertPushed(ProcessNewVideo::class);
    }

    public function testHandleMissingSprites()
    {
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);
        
        $disk = Storage::fake('test-thumbs');

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        $copyVideo = VideoTest::create();

        $v1 = '/0.jpg';
        $p1 = $prefix.$v1;

        $disk->put($p1, '');

        $this->assertFileExists($disk->path($p1));

        Queue::fake();
        with(new CloneVideoThumbnails($copyVideo, $prefix))->handle();
        Queue::assertPushed(ProcessNewVideo::class);
    }
}
