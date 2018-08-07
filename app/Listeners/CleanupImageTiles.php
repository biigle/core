<?php

namespace Biigle\Listeners;

use Storage;
use Illuminate\Contracts\Queue\ShouldQueue;

class CleanupImageTiles implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  array  $uuids  The volume image UUIDs
     * @return void
     */
    public function handle(array $uuids)
    {
        $disk = Storage::disk(config('image.tiles.disk'));

        foreach ($uuids as $uuid) {
            $disk->delete(fragment_uuid_path($uuid));
        }
    }
}
