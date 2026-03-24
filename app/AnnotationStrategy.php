<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * This Model describes the annotation strategy of a Project
 *
 * @property int $id
 */
class AnnotationStrategy extends Model
{
    use HasFactory;

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id' => 'int',
        'project' => 'int',
        'description' => 'string',
    ];

    protected $fillable = [
        'project',
        'description',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The project this strategy belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Project, $this>
     */
    public function project()
    {
        return $this->belongsTo(Project::class, 'project');
    }

    /**
     * The labels within this strategy.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<AnnotationStrategyLabel, $this>
     */
    public function strategyLabels()
    {
        return $this->hasMany(AnnotationStrategyLabel::class, 'annotation_strategy');
    }
}
