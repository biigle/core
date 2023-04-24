<?php

namespace Biigle\Listeners;

use Biigle\Events\ImagesDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;

class CleanupImageThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  ImagesDeleted  $event  The volume image UUIDs
     * @return void
     */
    public function handle(ImagesDeleted $event)
    {
        $disk = Storage::disk(config('thumbnails.storage_disk'));
        $format = config('thumbnails.format');

        foreach ($event->uuids as $uuid) {
            $prefix = fragment_uuid_path($uuid);
            $disk->delete("{$prefix}.{$format}");
        }
    }
}
