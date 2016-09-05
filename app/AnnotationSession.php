<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;

/**
 * An annotation session groups multiple annotations of a transect based on their
 * creation date.
 */
class AnnotationSession extends Model
{
    /**
     * Validation rules for updating an annotation session.
     *
     * @var array
     */
    public static $storeRules = [
        'name' => 'required',
        'starts_at' => 'required|date',
        'ends_at' => 'required|date|after:starts_at',
        'hide_other_users_annotations' => 'filled|boolean',
        'hide_own_annotations' => 'filled|boolean',
    ];

    /**
     * Validation rules for updating an annotation session.
     *
     * @var array
     */
    public static $updateRules = [
        'name' => 'filled',
        'starts_at' => 'filled|date',
        'ends_at' => 'filled|date',
        'hide_other_users_annotations' => 'filled|boolean',
        'hide_own_annotations' => 'filled|boolean',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'hide_other_users_annotations' => 'boolean',
        'hide_own_annotations' => 'boolean',
        'transect_id' => 'int',
    ];

    /**
     * The transect, this annotation session belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function transect()
    {
        return $this->belongsTo('Dias\Transect');
    }
}
