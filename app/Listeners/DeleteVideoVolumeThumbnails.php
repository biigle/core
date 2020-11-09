<?php

namespace Biigle\Listeners;

use Biigle\Events\VideoDeleted;

class DeleteVideoVolumeThumbnails
{
    /**
      * Handle the event.
      *
      * @param  VideoDeleted  $event
      * @return void
      */
    public function handle(VideoDeleted $event)
    {
        $video = $event->video;
        if ($video->volume->thumbnails->pluck('id')->contains($video->id)) {
            $video->volume->flushThumbnailCache();
        }
    }
}
