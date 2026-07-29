<?php

namespace Biigle\Observers;

use Biigle\AnnotationGuidelineLabel;
use Biigle\Label;
use DB;

class LabelObserver
{
    public function deleting(Label $label)
    {
        // Delete annotation guideline labels manually to clean up their stored
        // reference images.
        DB::transaction(
            fn () =>
            AnnotationGuidelineLabel::where('label_id', $label->id)->each(fn ($gl) => $gl->delete())
        );
    }
}
