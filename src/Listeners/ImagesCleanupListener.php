<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Events\ImagesDeleted;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;

class ImagesCleanupListener
{
    /**
     * Handle the event.
     *
     * Assembles the volume ID and annotation IDs for the RemoveImageAnnotationPatches job.
     * The job will be queued and when it is run, the volume, images and annotations
     * may no longer exist in the DB.
     *
     * @param  ImagesDeleted  $event
     * @return void
     */
    public function handle(ImagesDeleted $event)
    {
        if (!empty($event->uuids)) {
            $annotationIds = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
                ->whereIn('images.uuid', $event->uuids)
                ->pluck('images.uuid', 'image_annotations.id')
                ->toArray();

            if (!empty($annotationIds)) {
                RemoveImageAnnotationPatches::dispatch($annotationIds);
            }
        }
    }
}
