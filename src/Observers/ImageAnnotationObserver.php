<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;

class ImageAnnotationObserver
{
    /**
     * Handle the event of creating/saving a single annotation.
     *
     * @param ImageAnnotation $annotation
     */
    public function saved(ImageAnnotation $annotation)
    {
        GenerateAnnotationPatch::dispatch($annotation)
            ->onQueue(config('largo.generate_annotation_patch_queue'))
            ->delay(config('largo.patch_generation_delay'));
    }

    /**
     * Handle the event of deleting a single annotation.
     *
     * @param ImageAnnotation $annotation
     * @return bool
     */
    public function deleting(ImageAnnotation $annotation)
    {
        RemoveAnnotationPatches::dispatch([$annotation->id => $annotation->image->uuid])
            ->onQueue(config('largo.remove_annotation_patches_queue'));

        return true;
    }
}
