<?php

namespace Dias\Modules\Ate\Listeners;

use Dias\Image;
use Dias\Annotation;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;

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
     * @param  array  $uuids  The transect image uuids
     * @return void
     */
    public function handle(array $uuids)
    {
        if (empty($uuids)) {
            return;
        }

        $image = Image::where('uuid', $uuids[0])->first();

        if (!$image) {
            return;
        }

        $ids = Image::where('transect_id', $image->transect_id)->pluck('id')->toArray();

        $annotationIds = Annotation::whereIn('image_id', $ids)
            ->pluck('id')
            ->toArray();

        $this->dispatch(new RemoveAnnotationPatches(
            $image->transect_id,
            $annotationIds
        ));
    }
}
