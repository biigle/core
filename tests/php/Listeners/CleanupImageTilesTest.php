<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\TiledImagesDeleted;
use Biigle\Listeners\CleanupImageTiles;
use Biigle\Tests\ImageTest;
use Illuminate\Events\CallQueuedListener;
use Queue;
use Storage;
use TestCase;

class CleanupImageTilesTest extends TestCase
{
    public function testHandle()
    {
        config(['image.tiles.disk' => 'tiles']);
        $image = ImageTest::create();
        $fragment = fragment_uuid_path($image->uuid);
        Storage::fake('tiles');
        Storage::disk('tiles')->put("{$fragment}/test.txt", 'test');

        with(new CleanupImageTiles)->handle(new TiledImagesDeleted([$image->uuid]));

        Storage::disk('tiles')->assertMissing("{$fragment}/test.txt");
    }

    public function testListen()
    {
        $image = ImageTest::create();
        event(new TiledImagesDeleted($image->uuid));
        Queue::assertPushed(CallQueuedListener::class, fn ($job) => $job->class === CleanupImageTiles::class);
    }
}
