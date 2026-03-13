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
    protected $primaryKey = ['annotation_strategy', 'label'];

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
        'reference_image' => 'string',
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
        'reference_image',
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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Label, $this>
     */
    public function label()
    {
        return $this->belongsTo(Label::class, 'label');
    }

    /**
     * Since this table does not have a primary key but uses two keys as primary keys
     *
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    protected function setKeysForSaveQuery($query)
    {
        foreach ($this->getKeyName() as $key) {
            $query->where($key, '=', $this->getAttribute($key));
        }
        return $query;
    }

}

