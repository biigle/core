<?php

namespace Biigle;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * This Model describes the annotation guideline of a Project
 *
 * @property int $id
 */
class AnnotationGuideline extends Model
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
     * The project this guideline belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Project, $this>
     */
    public function project()
    {
        return $this->belongsTo(Project::class, 'project');
    }

    /**
     * The labels within this guideline.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<AnnotationGuidelineLabel, $this>
     */
    public function guidelineLabels()
    {
        return $this->hasMany(AnnotationGuidelineLabel::class, 'annotation_guideline');
    }
}
