<?php

namespace Biigle\Modules\Largo\Observers;

use Biigle\VideoAnnotationLabel;
use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;

class VideoAnnotationLabelObserver
{
    /**
     * Handle the event of creating an annotation label.
     */
    public function created(VideoAnnotationLabel $annotationLabel): void
    {
        CopyVideoAnnotationFeatureVector::dispatch($annotationLabel);
    }
}
