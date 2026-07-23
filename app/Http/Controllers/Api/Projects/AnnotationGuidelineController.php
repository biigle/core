<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use DB;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class AnnotationGuidelineController extends Controller
{
    /**
     * Get the annotation guideline for the given project.
     *
     * @api {get} projects/:id/annotation-guidelines Get the annotation guideline
     * @apiGroup Projects
     * @apiName IndexAnnotationGuideline
     * @apiParam {Number} id The project ID
     * @apiPermission projectMember
     * @apiDescription Returns the annotation guideline with its associated labels.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *   "id": 1,
     *   "project_id": 2,
     *   "description": "guideline description",
     *   "labels": [{
     *     "id": 4,
     *     "name": "some label",
     *     "pivot": {
     *       "uuid": "...",
     *       "annotation_guideline_id": 1,
     *       "label_id": 4,
     *       "shape_id": 7,
     *       "description": "description of a label",
     *       "reference_image_url": null
     *     }
     *   }]
     * }
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $guideline = $project->annotationGuideline;

        if (!$guideline) {
            abort(Response::HTTP_NOT_FOUND);
        }

        return $guideline->load('labels');
    }

    /**
     * Create the annotation guideline for the given project.
     *
     * @api {post} projects/:id/annotation-guidelines Create the annotation guideline
     * @apiGroup Projects
     * @apiName StoreAnnotationGuideline
     * @apiParam {Number} id The project ID
     * @apiParam {String} [description] Description of how to annotate.
     * @apiParam {Boolean} [enforced] Whether the guideline restricts the available labels and shapes for new annotations.
     * @apiParam {Number[]} [only_shapes] IDs of the shapes that should be available for new annotations. If empty, all shapes are available. Can only be set if enforced is true.
     * @apiPermission projectAdmin
     */
    public function store(Request $request, int $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        $request->validate([
            'description' => 'nullable|string|min:1',
            'enforced' => 'boolean',
            'only_shapes' => 'nullable|array|prohibited_unless:enforced,true',
            'only_shapes.*' => 'distinct|integer|exists:shapes,id',
        ]);

        $guideline = AnnotationGuideline::firstOrCreate(
            [
                'project_id' => $project->id,
            ],
            [
                'description' => $request->description,
                'enforced' => $request->boolean('enforced'),
                'only_shapes' => $this->castOnlyShapes($request->only_shapes),
            ],
        );

        if (!$guideline->wasRecentlyCreated) {
            throw ValidationException::withMessages([
                'id' => 'The project already has an annotation guideline.',
            ]);
        }

        return $guideline;
    }

    /**
     * Update the annotation guideline.
     *
     * @api {put} annotation-guidelines/:id Update the annotation guideline
     * @apiGroup Projects
     * @apiName UpdateAnnotationGuideline
     * @apiParam {Number} id The guideline ID
     * @apiParam {String} [description] Description of how to annotate.
     * @apiParam {Boolean} [enforced] Whether the guideline restricts the available labels and shapes for new annotations.
     * @apiParam {Number[]} [only_shapes] IDs of the shapes that should be available for new annotations. If empty, all shapes are available. Can only be set if enforced is true.
     * @apiPermission projectAdmin
     */
    public function update(Request $request, int $id)
    {
        $guideline = AnnotationGuideline::findOrFail($id);
        $this->authorize('update', $guideline->project);

        $request->validate([
            'description' => 'nullable|string|min:1',
            'enforced' => 'boolean',
            'only_shapes' => 'nullable|array|prohibited_unless:enforced,true',
            'only_shapes.*' => 'distinct|integer|exists:shapes,id',
        ]);

        $onlyShapes = $this->castOnlyShapes($request->only_shapes);

        $guideline->update([
            'description' => $request->description,
            'enforced' => $request->boolean('enforced'),
            'only_shapes' => $onlyShapes,
        ]);

        if ($request->exists('only_shapes') && !is_null($onlyShapes)) {
            AnnotationGuidelineLabel::where('annotation_guideline_id', $guideline->id)
                ->whereNotNull('shape_id')
                ->whereNotIn('shape_id', $onlyShapes)
                ->update(['shape_id' => null]);
        }
    }

    /**
     * Cast the IDs of the only_shapes attribute to int.
     *
     * @param array|null $onlyShapes
     *
     * @return array|null
     */
    protected function castOnlyShapes(?array $onlyShapes)
    {
        if (empty($onlyShapes)) {
            return null;
        }

        return array_map('intval', $onlyShapes);
    }

    /**
     * Delete the annotation guideline.
     *
     * @api {delete} annotation-guidelines/:id Delete the annotation guideline
     * @apiGroup Projects
     * @apiName DestroyAnnotationGuideline
     * @apiParam {Number} id The guideline ID
     * @apiPermission projectAdmin
     */
    public function destroy(int $id)
    {
        $guideline = AnnotationGuideline::findOrFail($id);
        $this->authorize('update', $guideline->project);
        // Wrap in a transaction so DB::afterCommit() in the guideline model defers
        // storage deletion until the DB delete is committed.
        DB::transaction(fn () => $guideline->delete());
    }
}
