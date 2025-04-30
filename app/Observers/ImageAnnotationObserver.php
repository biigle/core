<?php

namespace Biigle\Observers;

use Biigle\Annotation;
use Biigle\Jobs\ProcessAnnotatedImage;
use Biigle\Jobs\RemoveImageAnnotationPatches;

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
