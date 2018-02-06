<?php

namespace Biigle\Tests\Listeners;

use File;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Listeners\CleanupImageTiles;

class ListenersCleanupImageTilesTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();

        File::shouldReceive('exists')
            ->once()
            ->with($image->tilePath)
            ->andReturn(true);

        File::shouldReceive('deleteDirectory')
            ->once()
            ->with($image->tilePath);

        with(new CleanupImageTiles)->handle([$image->uuid]);
    }
}
