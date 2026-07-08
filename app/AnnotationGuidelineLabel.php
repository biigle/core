<?php

namespace Biigle;

use DB;
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

    protected $primaryKey = 'uuid';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * The attributes that should be casted to native types.
     *
     * @var list<string>
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
            if (is_null($guidelineLabel->reference_image_path)) {
                return;
            }

            // Defer storage deletion until after the DB transaction commits to avoid
            // deleting files if the transaction rolls back.
            DB::afterCommit(function () use ($guidelineLabel) {
                Storage::disk(config('projects.annotation_guideline_disk'))
                    ->delete($guidelineLabel->reference_image_path);
            });
        });
    }

    public function getReferenceImageUrlAttribute(): ?string
    {
        if (is_null($this->reference_image_path)) {
            return null;
        }

        return Storage::disk(config('projects.annotation_guideline_disk'))
            ->url($this->reference_image_path);
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
