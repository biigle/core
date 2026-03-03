<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Biigle\ProjectStrategy;

/**
 * Model for annotation strategies associated to a Model.
 *
 * @property int $id
 */
class ProjectStrategyLabel extends Model
{
    use HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'int',
        'project_strategy' => 'int',
        'label_id' => 'int',
        'preferred_shape' => 'int',
        'description' => 'int',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The project strategy this instance belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<ProjectStrategy, $this>
     */
    public function projectStrategy()
    {
        return $this->belongsTo(ProjectStrategy::class, 'project');
    }
}

