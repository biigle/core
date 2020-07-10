<?php

namespace Biigle;

use Biigle\User;
use Biigle\Shape;
use Biigle\Label;
use Illuminate\Database\Eloquent\Model;

class VideoAnnotationLabel extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'label_id',
        'user_id',
        'video_annotation_id',
    ];

    /**
     * The video annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function annotation()
    {
        return $this->belongsTo(VideoAnnotation::class, 'video_annotation_id');
    }

    /**
     * The label, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The user who created this annotation label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class)->select('id', 'firstname', 'lastname');
    }
}
