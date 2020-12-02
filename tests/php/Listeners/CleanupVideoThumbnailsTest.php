<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\VideosDeleted;
use Biigle\Listeners\CleanupVideoThumbnails;
use Biigle\Tests\VideoTest;
use Illuminate\Events\CallQueuedListener;
use Queue;
use Storage;
use TestCase;

class CleanupVideoThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('test-thumbs');
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        Storage::disk('test-thumbs')->put("{$prefix}/0.txt", 'content');
        with(new CleanupVideoThumbnails)->handle(new VideosDeleted($video->uuid));
        $this->assertFalse(Storage::disk('test-thumbs')->exists("{$prefix}/0.txt"));
    }

    public function testListen()
    {
        $video = VideoTest::create();
        event(new VideosDeleted($video->uuid));
        Queue::assertPushed(CallQueuedListener::class, function ($job) {
            return $job->class === CleanupVideoThumbnails::class;
        });
    }
}
