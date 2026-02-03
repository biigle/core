<?php

namespace Biigle\Observers;

use Biigle\Annotation;

abstract class AnnotationObserver
{
    /**
     * Handle the event of creating/saving a single annotation.
     *
     * @param Annotation $annotation
     */
    public function saved(Annotation $annotation)
    {
        $this->getSavedDispatch($annotation)
            ->onQueue(config('largo.generate_annotation_patch_queue'))
            ->delay(config('largo.patch_generation_delay'));
    }

    /**
     * Handle the event of deleting a single annotation.
     *
     * @param Annotation $annotation
     *
     */
    public function deleting(Annotation $annotation)
    {
        $this->getDeletingDispatch($annotation)
            ->onQueue(config('largo.remove_annotation_patches_queue'));
    }

    /**
     * Get the dispatched job on a saved event.
     *
     * @param Annotation $annotation
     *
     * @return \Illuminate\Foundation\Bus\PendingDispatch
     */
    abstract protected function getSavedDispatch(Annotation $annotation);

    /**
     * Get the dispatched job on a deleting event.
     *
     * @param Annotation $annotation
     *
     * @return \Illuminate\Foundation\Bus\PendingDispatch
     */
    abstract protected function getDeletingDispatch(Annotation $annotation);
}
