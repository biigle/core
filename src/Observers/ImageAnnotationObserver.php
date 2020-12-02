<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;

class ImageAnnotationObserver extends AnnotationObserver
{
    /**
     * {@inheritdoc}
     */
    protected function getSavedDispatch(Annotation $annotation)
    {
        return GenerateImageAnnotationPatch::dispatch($annotation);
    }

    /**
     * {@inheritdoc}
     */
    protected function getDeletingDispatch(Annotation $annotation)
    {
        return RemoveImageAnnotationPatches::dispatch([
            $annotation->id => $annotation->image->uuid,
        ]);
    }
}
