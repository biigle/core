<?php

namespace Dias\Modules\Ate\Listeners;

use Illuminate\Foundation\Bus\DispatchesJobs;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;
use Dias\Image;
use Dias\Annotation;

class ImagesCleanupListener
{
    use DispatchesJobs;

    /**
     * Handle the event.
     *
     * Assembles the transect ID and annotation IDs for the RemoveAnnotationPatches job.
     * The job will be queued and when it is run, the transect, images and annotations
     * may no longer exist in the DB.
     *
     * @param  array  $ids  The transect image ids
     * @return void
     */
    public function handle(array $ids)
    {
        if (empty($ids)) {
            return;
        }

        $image = Image::find($ids[0]);

        if (!$image) {
            return;
        }

        $annotationIds = Annotation::whereIn('image_id', $ids)
            ->pluck('id')
            ->toArray();

        $this->dispatch(new RemoveAnnotationPatches(
            $image->transect_id,
            $annotationIds
        ));
    }
}
