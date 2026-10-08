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
 * @property bool $can_annotate Only set by AnnotationGuidelineService::getGuidelines().
 * @property int|null $project_role_id Only set temporarily by AnnotationGuidelineService::getGuidelines().
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

    /**
     * Shape IDs (or null) of the guideline labels, keyed by label ID.
     *
     * @var array<int, int|null>|null
     */
    protected ?array $labelShapes = null;

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
     * Determine if the guideline allows the label.
     */
    public function allowsLabel(int $labelId): bool
    {
        if (!$this->enforced) {
            return true;
        }

        $labelShapes = $this->getLabelShapes();

        return empty($labelShapes) || array_key_exists($labelId, $labelShapes);
    }

    /**
     * Determine if the guideline allows the shape (optionally in combination with a
     * label).
     */
    public function allowsShape(int $shapeId, ?int $labelId = null): bool
    {
        $shapeIds = $this->allowedShapes($labelId);

        return is_null($shapeIds) || in_array($shapeId, $shapeIds, true);
    }

    /**
     * Get the IDs of the shapes that are allowed by the guideline (optionally in
     * combination with a label).
     *
     * @return array<int>|null Null if all shapes are allowed.
     */
    public function allowedShapes(?int $labelId = null): ?array
    {
        if (!$this->enforced) {
            return null;
        }

        if (!is_null($labelId)) {
            $labelShapes = $this->getLabelShapes();
            $labelShapeId = $labelShapes[$labelId] ?? null;
            if (!is_null($labelShapeId)) {
                return [$labelShapeId];
            }
        }

        return $this->only_shapes;
    }

    /**
     * Get the shape IDs of the guideline labels, keyed by label ID.
     *
     * @return array<int, int|null>
     */
    protected function getLabelShapes(): array
    {
        // Memoized because the checks may run many times for a single request (e.g.
        // bulk annotation creation or Largo).
        if (is_null($this->labelShapes)) {
            $this->labelShapes = AnnotationGuidelineLabel::where('annotation_guideline_id', $this->id)
                ->pluck('shape_id', 'label_id')
                ->all();
        }

        return $this->labelShapes;
    }
}
