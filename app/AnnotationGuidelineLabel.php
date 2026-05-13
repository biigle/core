<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Storage;

/**
 * Pivot model for labels within an annotation guideline.
 */
class AnnotationGuidelineLabel extends Pivot
{
    use HasFactory;

    protected $table = 'annotation_guideline_label';

    protected static function booted(): void
    {
        static::deleting(function (self $guidelineLabel) {
            Storage::disk(config('projects.annotation_guideline_storage_disk'))
                ->delete("{$guidelineLabel->annotation_guideline_id}/{$guidelineLabel->uuid}");
        });
    }

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
