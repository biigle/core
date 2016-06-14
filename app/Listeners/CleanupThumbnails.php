<?php

namespace Dias\Listeners;

use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Dias\Image;
use File;

class CleanupThumbnails implements ShouldQueue
{
    /**
     * Handle the event.
     *
     * @param  array  $ids  The transect image ids
     * @return void
     */
    public function handle(array $ids)
    {
        $prefix = config('thumbnails.storage');
        $format = Image::THUMB_FORMAT;

        foreach ($ids as $id) {
            if (File::exists("{$prefix}/{$id}.{$format}")) {
                File::delete("{$prefix}/{$id}.{$format}");
            }
        }
    }
}
