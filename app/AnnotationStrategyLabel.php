<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model for labels within an annotation strategy.
 *
 * @property int $id
 */
class AnnotationStrategyLabel extends Model
{
    use HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'annotation_strategy' => 'int',
        'label' => 'int',
        'shape' => 'int',
        'description' => 'string',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'annotation_strategy',
        'label',
        'shape',
        'description',
    ];
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The labels that have a strategy for their annotation
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Label, $this>
     */
    public function label()
    {
        return $this->belongsTo(Label::class, 'label');
    }
}
