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

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $appends = ['reference_image_url'];

    protected $casts = [
        'label_id' => 'int',
        'shape_id' => 'int',
        'annotation_guideline_id' => 'int',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $guidelineLabel) {
            Storage::disk(config('projects.annotation_guideline_disk'))
                ->delete("{$guidelineLabel->annotation_guideline_id}/{$guidelineLabel->uuid}");
        });
    }

    public function getReferenceImageUrlAttribute(): string
    {
        return Storage::disk(config('projects.annotation_guideline_disk'))
            ->url("{$this->annotation_guideline_id}/{$this->uuid}");
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
