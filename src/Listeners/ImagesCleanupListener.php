<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Annotation;
use Biigle\Events\ImagesDeleted;
use Biigle\Image;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;

class ImagesCleanupListener
{
    /**
     * Handle the event.
     *
     * Assembles the volume ID and annotation IDs for the RemoveAnnotationPatches job.
     * The job will be queued and when it is run, the volume, images and annotations
     * may no longer exist in the DB.
     *
     * @param  ImagesDeleted  $event
     * @return void
     */
    public function handle(ImagesDeleted $event)
    {
        if (!empty($event->uuids)) {
            $annotationIds = Annotation::join('images', 'images.id', '=', 'annotations.image_id')
                ->whereIn('images.uuid', $event->uuids)
                ->pluck('images.uuid', 'annotations.id')
                ->toArray();

            if (!empty($annotationIds)) {
                RemoveAnnotationPatches::dispatch($annotationIds);
            }
        }
    }
}
