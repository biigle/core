<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

abstract class AnnotationLabel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'label_id',
        'user_id',
        'annotation_id',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<int, string>
     */
    protected $casts = [
        'user_id' => 'int',
        'annotation_id' => 'int',
    ];

    /**
     * The annotation, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Annotation, AnnotationLabel>
     */
    abstract public function annotation();

    /**
     * The label, this annotation label belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Label, AnnotationLabel>
     */
    public function label()
    {
        return $this->belongsTo(Label::class);
    }

    /**
     * The user who created this annotation label.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, AnnotationLabel>
     */
    public function user()
    {
        return $this->belongsTo(User::class)->select('id', 'firstname', 'lastname');
    }
}
