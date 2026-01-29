<?php

namespace Biigle\Observers;

use Biigle\Events\VideosDeleted;
use Biigle\Video;

class VideoObserver
{
    /**
     * Handle the event of deleting a single video.
     *
     * @param Video $video
     * @return bool
     */
    public function deleting(Video $video)
    {
        event(new VideosDeleted($video->uuid));

        if ($video->volume->thumbnails->pluck('id')->contains($video->id)) {
            $video->volume->flushThumbnailCache();
        }
    }
}
