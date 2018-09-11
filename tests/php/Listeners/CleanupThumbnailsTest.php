<?php

namespace Biigle\Tests\Listeners;

use File;
use Queue;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Events\ImagesDeleted;
use Biigle\Listeners\CleanupThumbnails;
use Illuminate\Events\CallQueuedListener;

class CleanupThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();

        File::shouldReceive('exists')
            ->once()
            ->with($image->thumbPath)
            ->andReturn(true);

        File::shouldReceive('delete')
            ->once()
            ->with($image->thumbPath);

        with(new CleanupThumbnails)->handle(new ImagesDeleted($image->uuid));
    }

    public function testListen()
    {
        $image = ImageTest::create();
        event(new ImagesDeleted($image->uuid));
        Queue::assertPushed(CallQueuedListener::class, function ($job) {
            return $job->class === CleanupThumbnails::class;
        });
    }
}
