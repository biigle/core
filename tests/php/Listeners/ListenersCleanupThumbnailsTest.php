<?php

use Copria\Transect;
use Dias\Listeners\CleanupThumbnails;

class ListenersCleanupThumbnailsTest extends TestCase
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

        with(new CleanupThumbnails)->handle([$image->uuid]);
    }
}
