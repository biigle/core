<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class AnnotationObserver
{
    /**
     * Handle the event of creating/saving a single annotation.
     *
     * @param Annotation $annotation
     */
    public function saved(Annotation $annotation)
    {
        GenerateAnnotationPatch::dispatch($annotation)
            ->onQueue(config('largo.generate_annotation_patch_queue'))
            ->delay(config('largo.patch_generation_delay'));
    }

    /**
     * Handle the event of deleting a single annotation.
     *
     * @param Annotation $annotation
     * @return bool
     */
    public function deleting(Annotation $annotation)
    {
        RemoveAnnotationPatches::dispatch([$annotation->id => $annotation->image->uuid])
            ->onQueue(config('largo.remove_annotation_patches_queue'));

        return true;
    }
}
