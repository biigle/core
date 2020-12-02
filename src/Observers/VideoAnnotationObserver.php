<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;

class VideoAnnotationObserver extends AnnotationObserver
{
    /**
     * {@inheritdoc}
     */
    protected function getSavedDispatch(Annotation $annotation)
    {
        return GenerateVideoAnnotationPatch::dispatch($annotation);
    }

    /**
     * {@inheritdoc}
     */
    protected function getDeletingDispatch(Annotation $annotation)
    {
        return RemoveVideoAnnotationPatches::dispatch([
            $annotation->id => $annotation->video->uuid,
        ]);
    }
}
