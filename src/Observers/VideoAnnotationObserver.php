<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;

class VideoAnnotationObserver extends AnnotationObserver
{
    /**
     * {@inheritdoc}
     */
    protected function getSavedDispatch(Annotation $a)
    {
        return ProcessAnnotatedVideo::dispatch($a->video, only: [$a->id]);
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
