<?php

namespace Dias\Tests\Listeners;

use File;
use TestCase;
use Copria\Transect;
use Dias\Tests\ImageTest;
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
