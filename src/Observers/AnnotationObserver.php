<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\Annotation;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class AnnotationObserver
{
    use DispatchesJobs;

    /**
     * Handle the event of creating/saving a single annotation.
     *
     * @param Annotation $annotation
     */
    public function saved(Annotation $annotation)
    {
        $prefix = config('largo.patch_storage').'/'.$annotation->image->volume_id;
        $format = config('largo.patch_format');
        $targetPath = "{$prefix}/{$annotation->id}.{$format}";

        $job = new GenerateAnnotationPatch($annotation, $targetPath);
        $job->delay(config('largo.patch_generation_delay'));
        $this->dispatch($job);
    }

    /**
     * Handle the event of deleting a single annotation.
     *
     * @param Annotation $annotation
     * @return bool
     */
    public function deleting(Annotation $annotation)
    {
        $this->dispatch(new RemoveAnnotationPatches(
            $annotation->image->volume_id,
            [$annotation->id]
        ));

        return true;
    }
}
