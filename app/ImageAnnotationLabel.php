<?php

namespace Biigle;

/**
 * Pivot object for the connection between ImageAnnotation and Label.
 */
class ImageAnnotationLabel extends AnnotationLabel
{
    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'user_id' => 'int',
        'annotation_id' => 'int',
        'confidence' => 'float',
    ];

    /**
     * The annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotation()
    {
        return $this->belongsTo(ImageAnnotation::class, 'annotation_id');
    }
}
