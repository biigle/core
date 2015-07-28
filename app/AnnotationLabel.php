<?php

namespace Dias;

use Dias\Contracts\BelongsToProjectContract;
use Illuminate\Database\Eloquent\Model;

// use Illuminate\Database\QueryException;

/**
 * Pivot object for the connection between Annotations and Labels.
 */
class AnnotationLabel extends Model implements BelongsToProjectContract
{
    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'label_id',
        'user_id',
        'annotation_id',
    ];

    /**
     * The annotation, this annotation label belongs to.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotation()
    {
        return $this->belongsTo('Dias\Annotation');
    }

    /**
     * The label, this annotation label belongs to.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function label()
    {
        return $this->belongsTo('Dias\Label');
    }

    /**
     * The user who created this annotation label.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo('Dias\User');
    }

    /**
     * {@inheritdoc}
     * @return array
     */
    public function projectIds()
    {
        return $this->annotation->projectIds();
    }

    /**
     * Accessor function to parse the confidence to float.
     * @param string $confidence
     * @return float
     */
    public function getConfidenceAttribute($confidence)
    {
        return (float) $confidence;
    }
}
