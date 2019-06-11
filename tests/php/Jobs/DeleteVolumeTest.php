<?php

namespace Biigle\Tests\Jobs;

use Event;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Jobs\DeleteVolume;
use Biigle\Events\ImagesDeleted;

class DeleteVolumeTest extends TestCase
{
    public function testHandle()
    {
        Event::fake([ImagesDeleted::class]);
        $image = ImageTest::create();
        with(new DeleteVolume($image->volume))->handle();
        $this->assertNull($image->volume->fresh());
        Event::assertDispatched(ImagesDeleted::class, function ($event) use ($image) {
            return $event->uuids[0] === $image->uuid;
        });
    }
}
