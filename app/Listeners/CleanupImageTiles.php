<?php

namespace Biigle\Listeners;

use File;
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
        $prefix = public_path(config('image.tiles.uri'));

        foreach ($uuids as $uuid) {
            if (File::exists("{$prefix}/{$uuid}")) {
                File::deleteDirectory("{$prefix}/{$uuid}");
            }
        }
    }
}
