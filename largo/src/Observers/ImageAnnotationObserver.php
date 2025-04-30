<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;

class ImageAnnotationObserver extends AnnotationObserver
{
    /**
     * {@inheritdoc}
     */
    protected function getSavedDispatch(Annotation $a)
    {
        return ProcessAnnotatedImage::dispatch($a->image, only: [$a->id]);
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
