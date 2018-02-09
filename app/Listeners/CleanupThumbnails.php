<?php

namespace Biigle\Listeners;

use File;
use Illuminate\Contracts\Queue\ShouldQueue;

class CleanupThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  array  $uuids  The volume image UUIDs
     * @return void
     */
    public function handle(array $uuids)
    {
        $prefix = public_path(config('thumbnails.uri'));
        $format = config('thumbnails.format');

        foreach ($uuids as $uuid) {
            $fragment = fragment_uuid_path($uuid);
            $path = "{$prefix}/{$fragment}.{$format}";
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }
}
