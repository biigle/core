<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\Jobs\CopyImageAnnotationFeatureVector;

class ImageAnnotationLabelObserver
{
    /**
     * Handle the event of creating an annotation label.
     */
    public function created(ImageAnnotationLabel $annotationLabel): void
    {
        CopyImageAnnotationFeatureVector::dispatch($annotationLabel);
    }
}
