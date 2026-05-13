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
        'project_id' => 'int',
        'description' => 'string',
    ];

    protected $fillable = [
        'project_id',
        'description',
    ];

    /**
     * The project this guideline belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Project, $this>
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * The labels within this guideline.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Label, $this, AnnotationGuidelineLabel>
     */
    public function labels()
    {
        return $this->belongsToMany(Label::class)
            ->using(AnnotationGuidelineLabel::class)
            ->withPivot('shape_id', 'description', 'reference_image_path');
    }
}
