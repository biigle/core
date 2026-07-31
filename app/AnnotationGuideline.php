<?php
namespace Biigle;

use DB;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Storage;

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
        'enforced' => 'boolean',
        'only_shapes' => 'array',
    ];

    protected $fillable = [
        'project_id',
        'description',
        'enforced',
        'only_shapes',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $guideline) {
            // Defer storage deletion until after the DB transaction commits to avoid
            // deleting files if the transaction rolls back.
            DB::afterCommit(function () use ($guideline) {
                Storage::disk(config('projects.annotation_guideline_disk'))
                    ->deleteDirectory("$guideline->id");
            });
        });
    }

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
            ->withPivot('shape_id', 'description', 'uuid', 'reference_image_path');
    }

    /**
     * Validates whether an annotation is compatible with an annotation guideline.
     *
     * @param int $labelId The ID of the desired annotation label
     * @param int $shapeId The ID of the desired annotation shape
     *
     * @return bool
     */
    public function validate(int $labelId, int $shapeId): bool
    {
        if ($this->enforced) {
            $labelInAnnotationGuideline = true;

            $annotationLabels = $this->labels();
            if ($annotationLabels->exists()) {
                $labelInAnnotationGuideline = $annotationLabels
                    ->wherePivot("label_id", $labelId)
                    ->where(function ($query) use ($shapeId, $annotationLabels) {
                        $pivotColumn = $annotationLabels->qualifyPivotColumn('shape_id');
                        $query->where($pivotColumn, $shapeId)
                            ->orWhereNull($pivotColumn);
                    })
                    ->exists();
            }

            $shapeInAnnotation = true;

            if (!is_null($this->only_shapes) && count($this->only_shapes) > 0) {
                $shapeInAnnotation = in_array($shapeId, $this->only_shapes);
            }
            return $labelInAnnotationGuideline && $shapeInAnnotation;
        }
        return true;
    }
}
