<?php

namespace Biigle;

class VideoAnnotationLabel extends AnnotationLabel
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'label_id',
        'user_id',
    ];

    /**
     * The video annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotation()
    {
        return $this->belongsTo(VideoAnnotation::class, 'annotation_id');
    }
}
