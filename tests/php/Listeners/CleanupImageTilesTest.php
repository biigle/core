<?php

namespace Biigle\Tests\Listeners;

use Storage;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Listeners\CleanupImageTiles;

class ListenersCleanupImageTilesTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        Storage::fake('local-tiles');
        Storage::disk('local-tiles')->put($fragment, 'test');

        with(new CleanupImageTiles)->handle([$image->uuid]);

        Storage::disk('local-tiles')->assertMissing($fragment);
    }
}
