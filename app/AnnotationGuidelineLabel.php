<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivot model for labels within an annotation guideline.
 */
class AnnotationGuidelineLabel extends Pivot
{
    protected $table = 'annotation_guideline_label';

    /**
     * The defined shape for this label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Shape, $this>
     */
    public function shape()
    {
        return $this->belongsTo(Shape::class);
    }
}
