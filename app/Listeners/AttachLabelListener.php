<?php

namespace Biigle\Listeners;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\ImageAnnotationLabel;
use Biigle\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Jobs\CopyVideoAnnotationFeatureVector;

class AttachLabelListener
{
    public function handle(AnnotationLabelAttached $event)
    {
        if ($event->annotationLabel instanceof ImageAnnotationLabel) {
            CopyImageAnnotationFeatureVector::dispatch($event->annotationLabel);
        } else {
            CopyVideoAnnotationFeatureVector::dispatch($event->annotationLabel);
        }
    }
}
