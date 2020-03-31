<?php

namespace Biigle\Tests\Modules\Videos\Listeners;

use Queue;
use TestCase;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Videos\Events\VideoDeleted;
use Biigle\Modules\Videos\Jobs\DeleteVideoThumbnails;
use Biigle\Modules\Videos\Listeners\PrepareDeleteVideoThumbnails;

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
