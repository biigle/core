<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Image;
use Biigle\Annotation;
use Biigle\Events\ImagesDeleted;
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
        if (empty($event->uuids)) {
            return;
        }

        $images = Image::whereIn('uuid', $event->uuids)->select('id', 'volume_id')->get();

        if ($images->isEmpty()) {
            return;
        }

        $annotationIds = Annotation::whereIn('image_id', $images->pluck('id'))
            ->pluck('id')
            ->toArray();

        RemoveAnnotationPatches::dispatch($images->first()->volume_id, $annotationIds);
    }
}
