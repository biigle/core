<?php

namespace Dias\Listeners;

use File;
use Dias\Image;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class CleanupThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  array  $uuids  The transect image UUIDs
     * @return void
     */
    public function handle(array $uuids)
    {
        $prefix = config('thumbnails.storage');
        $format = Image::THUMB_FORMAT;

        foreach ($uuids as $uuid) {
            if (File::exists("{$prefix}/{$uuid}.{$format}")) {
                File::delete("{$prefix}/{$uuid}.{$format}");
            }
        }
    }
}
