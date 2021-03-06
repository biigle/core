<?php

namespace Biigle\Tests\Jobs;

use Biigle\Events\ImagesDeleted;
use Biigle\Jobs\DeleteVolume;
use Biigle\Tests\ImageTest;
use Event;
use TestCase;

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
