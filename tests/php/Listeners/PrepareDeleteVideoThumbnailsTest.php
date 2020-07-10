<?php

namespace Biigle\Tests\Listeners;

use Queue;
use TestCase;
use Biigle\Tests\VideoTest;
use Biigle\Events\VideoDeleted;
use Biigle\Jobs\DeleteVideoThumbnails;
use Biigle\Listeners\PrepareDeleteVideoThumbnails;

class PrepareDeleteVideoThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        Queue::fake();
        $event = new VideoDeleted(VideoTest::create());
        (new PrepareDeleteVideoThumbnails)->handle($event);
        Queue::assertPushed(DeleteVideoThumbnails::class);
    }
}
