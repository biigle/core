<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;

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
