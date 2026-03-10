<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Biigle\AnnotationStrategy;

/**
 * Model for annotation strategies associated to a Model.
 *
 * @property int $id
 */
class AnnotationStrategyLabel extends Model
{
    use HasFactory;
    public $incrementing = false;
    protected $primaryKey = null;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'annotation_strategy_id' => 'int',
        'label_id' => 'int',
        'shape_id' => 'int',
        'description' => 'string',
    ];
    //TODO: add comment

    protected $fillable = [
        'annotation_strategy_id',
        'label_id',
        'shape_id',
        'description',
    ];
    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    public function label()
    {
        return $this->belongsTo(Label::class, foreignKey: 'label_id');
    }
}

