<?php

namespace Biigle\Modules\Videos;

use Biigle\Shape;
use Illuminate\Database\Eloquent\Model;

class VideoAnnotation extends Model
{
    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'frames' => 'array',
        'points' => 'array',
    ];

    /**
     * The video, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function video()
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * The shape of this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function shape()
    {
        return $this->belongsTo(Shape::class);
    }
}
