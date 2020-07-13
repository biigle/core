<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\VideoDeleted;
use Biigle\Jobs\DeleteVideoThumbnails;
use Biigle\Listeners\PrepareDeleteVideoThumbnails;
use Biigle\Tests\VideoTest;
use Queue;
use TestCase;

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
