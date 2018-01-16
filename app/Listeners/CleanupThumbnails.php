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
            $path = "{$prefix}/{$uuid[0]}{$uuid[1]}/{$uuid[2]}{$uuid[3]}/{$uuid}.{$format}";
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }
}
