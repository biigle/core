<?php

namespace Biigle\Listeners;

use File;
use Biigle\Image;
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
            if (File::exists("{$prefix}/{$uuid}.{$format}")) {
                File::delete("{$prefix}/{$uuid}.{$format}");
            }
        }
    }
}
