<?php

namespace Biigle\Tests\Listeners;

use File;
use TestCase;
use Copria\Volume;
use Biigle\Tests\ImageTest;
use Biigle\Listeners\CleanupThumbnails;

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
