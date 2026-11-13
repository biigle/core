<?php

namespace Biigle;

use Biigle\Enums\Shape;
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
        'allow_aligned_rectangle' => 'boolean',
    ];

    protected $fillable = [
        'project_id',
        'description',
        'enforced',
        'only_shapes',
        'allow_aligned_rectangle',
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
            ->withPivot('shape', 'allow_aligned_rectangle', 'description', 'uuid', 'reference_image_path');
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
    public function allowsShape(Shape $shape, ?int $labelId = null): bool
    {
        $shapeIds = $this->allowedShapes($labelId);

        return is_null($shapeIds) || in_array($shape->value, $shapeIds, true);
    }

    /**
     * Get the IDs of the shapes that are allowed by the guideline (optionally in
     * combination with a label).
     *
     * Returns plain IDs and not Shape enums because they match the format of
     * only_shapes and are sorted/joined by ApplyLargoSession to group shape checks.
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

        $onlyShapes = $this->only_shapes;

        // The aligned rectangle tool is only restricted in the frontend. It creates
        // rectangles, so they must be allowed here even if only_shapes doesn't include
        // them. This also applies to an empty only_shapes array, which means that no
        // shape is allowed except those of the separately allowed tools.
        if (!is_null($onlyShapes) && $this->allow_aligned_rectangle && !in_array(Shape::RECTANGLE->value, $onlyShapes, true)) {
            $onlyShapes[] = Shape::RECTANGLE->value;
        }

        return $onlyShapes;
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
                ->pluck('shape', 'label_id')
                ->all();
        }

        return $this->labelShapes;
    }
}
