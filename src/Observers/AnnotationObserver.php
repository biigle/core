<?php

namespace Dias\Modules\Ate\Observers;

use Dias\Annotation;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;
use Dias\Modules\Ate\Jobs\GenerateAnnotationPatch;

class AnnotationObserver
{

    use DispatchesJobs;

    /**
     * Handle the event of creating/saving a single annotation
     *
     * @param Annotation $annotation
     */
    public function saved(Annotation $annotation)
    {
        $job = new GenerateAnnotationPatch($annotation);
        $job->delay(config('ate.patch_generation_delay'));
        $this->dispatch($job);
    }

    /**
     * Handle the event of deleting a single annotation
     *
     * @param Annotation $annotation
     * @return bool
     */
    public function deleting(Annotation $annotation)
    {
        $this->dispatch(new RemoveAnnotationPatches(
            $annotation->image->transect_id,
            [$annotation->id]
        ));

        return true;
    }
}
