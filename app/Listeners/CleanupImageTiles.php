<?php

namespace Biigle\Listeners;

use Biigle\Events\TiledImagesDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;

class CleanupImageTiles implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  TiledImagesDeleted  $event
     * @return void
     */
    public function handle(TiledImagesDeleted $event)
    {
        $disk = Storage::disk(config('image.tiles.disk'));

        foreach ($event->uuids as $uuid) {
            $disk->deleteDirectory(fragment_uuid_path($uuid));
        }
    }
}
