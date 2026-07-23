<?php

namespace Biigle\Observers;

use Biigle\AnnotationGuidelineLabel;
use Biigle\LabelTree;
use DB;

class LabelTreeObserver
{
    public function deleting(LabelTree $labelTree)
    {
        // Delete annotation guideline labels manually to clean up their stored
        // reference images.
        DB::transaction(
            fn () =>
            AnnotationGuidelineLabel::whereIn('label_id', fn ($q) => $q->select('id')->from('labels')->where('label_tree_id', $labelTree->id))
                ->each(fn ($gl) => $gl->delete())
        );
    }
}
