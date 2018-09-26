<?php

namespace Biigle\Listeners;

use File;
use Biigle\Events\ImagesDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;

class CleanupThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  ImagesDeleted  $event  The volume image UUIDs
     * @return void
     */
    public function handle(ImagesDeleted $event)
    {
        $prefix = public_path(config('thumbnails.uri'));
        $format = config('thumbnails.format');

        foreach ($event->uuids as $uuid) {
            $fragment = fragment_uuid_path($uuid);
            $path = "{$prefix}/{$fragment}.{$format}";
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }
}
