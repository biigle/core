<?php

namespace Biigle\Listeners;

use Biigle\Events\VideosDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;

class CleanupVideoThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  VideosDeleted  $event  The volume video UUIDs
     * @return void
     */
    public function handle(VideosDeleted $event)
    {
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));

        foreach ($event->uuids as $uuid) {
            $disk->deleteDirectory(fragment_uuid_path($uuid));
        }
    }
}
