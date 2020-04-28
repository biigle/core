<?php

namespace Biigle\Tests\Listeners;

use Queue;
use Storage;
use TestCase;
use Biigle\Tests\ImageTest;
use Biigle\Events\TiledImagesDeleted;
use Biigle\Listeners\CleanupImageTiles;
use Illuminate\Events\CallQueuedListener;

class CleanupImageTilesTest extends TestCase
{
    public function testHandle()
    {
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        Storage::fake('local-tiles');
        Storage::disk('local-tiles')->put("{$fragment}.tar.gz", 'test');

        with(new CleanupImageTiles)->handle(new TiledImagesDeleted([$image->uuid]));

        Storage::disk('local-tiles')->assertMissing("{$fragment}.tar.gz");
    }

    public function testListen()
    {
        $image = ImageTest::create();
        event(new TiledImagesDeleted($image->uuid));
        Queue::assertPushed(CallQueuedListener::class, function ($job) {
            return $job->class === CleanupImageTiles::class;
        });
    }
}
