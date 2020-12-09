<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Events\VideosDeleted;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;

class VideosCleanupListener
{
    /**
     * Handle the event.
     *
     * Assembles the volume ID and annotation IDs for the RemoveVideoAnnotationPatches
     * job. The job will be queued and when it is run, the volume, videos and annotations
     * may no longer exist in the DB.
     *
     * @param  VideosDeleted  $event
     * @return void
     */
    public function handle(VideosDeleted $event)
    {
        if (!empty($event->uuids)) {
            $annotationIds = VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
                ->whereIn('videos.uuid', $event->uuids)
                ->pluck('videos.uuid', 'video_annotations.id')
                ->toArray();

            if (!empty($annotationIds)) {
                RemoveVideoAnnotationPatches::dispatch($annotationIds);
            }
        }
    }
}
