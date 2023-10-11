<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\ImagesDeleted;
use Biigle\Listeners\CleanupImageThumbnails;
use Biigle\Tests\ImageTest;
use Illuminate\Events\CallQueuedListener;
use Queue;
use Storage;
use TestCase;

class CleanupImageThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('test-thumbs');
        config(['thumbnails.storage_disk' => 'test-thumbs']);

        $image = ImageTest::create();
        $prefix = fragment_uuid_path($image->uuid);
        $format = config('thumbnails.format');
        Storage::disk('test-thumbs')->put("{$prefix}.{$format}", 'content');
        with(new CleanupImageThumbnails)->handle(new ImagesDeleted($image->uuid));
        $this->assertFalse(Storage::disk('test-thumbs')->exists("{$prefix}.{$format}"));
    }

    public function testListen()
    {
        $image = ImageTest::create();
        event(new ImagesDeleted($image->uuid));
        Queue::assertPushed(CallQueuedListener::class, fn ($job) => $job->class === CleanupImageThumbnails::class);
    }
}
