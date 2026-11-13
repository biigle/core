<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Enums\Shape;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreAnnotationGuideline;
use Biigle\Http\Requests\UpdateAnnotationGuideline;
use Biigle\Project;
use DB;
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
     *       "shape": 7,
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
     * @apiParam {Number[]} [only_shapes] IDs of the shapes that should be available for new annotations. If null or omitted, all shapes are available. If empty, no shape is available, so only the tools that are allowed separately (e.g. with allow_aligned_rectangle) can be used. An empty array requires at least one of these tools. Can only be set if enforced is true.
     * @apiParam {Boolean} [allow_aligned_rectangle] Whether the aligned rectangle tool should be available in the annotation tools (default `true`). This is independent of the rectangle shape in only_shapes. Ignored if enforced is false.
     * @apiPermission projectAdmin
     */
    public function store(StoreAnnotationGuideline $request)
    {
        $guideline = AnnotationGuideline::firstOrCreate(
            [
                'project_id' => $request->project->id,
            ],
            [
                'description' => $request->description,
                'enforced' => $request->boolean('enforced'),
                'only_shapes' => $request->getOnlyShapes(),
                'allow_aligned_rectangle' => $request->getAllowAlignedRectangle(),
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
     * @apiParam {Number[]} [only_shapes] IDs of the shapes that should be available for new annotations. If null or omitted, all shapes are available. If empty, no shape is available, so only the tools that are allowed separately (e.g. with allow_aligned_rectangle) can be used. An empty array requires at least one of these tools. Can only be set if enforced is true.
     * @apiParam {Boolean} [allow_aligned_rectangle] Whether the aligned rectangle tool should be available in the annotation tools (default `true`). This is independent of the rectangle shape in only_shapes. If omitted, it is reset to `true`. Ignored if enforced is false.
     * @apiPermission projectAdmin
     */
    public function update(UpdateAnnotationGuideline $request)
    {
        $guideline = $request->guideline;
        $onlyShapes = $request->getOnlyShapes();
        $allowAlignedRectangle = $request->getAllowAlignedRectangle();

        $guideline->update([
            'description' => $request->description,
            'enforced' => $request->boolean('enforced'),
            'only_shapes' => $onlyShapes,
            'allow_aligned_rectangle' => $allowAlignedRectangle,
        ]);

        $labels = AnnotationGuidelineLabel::where('annotation_guideline_id', $guideline->id)
            ->whereNotNull('shape');

        if (!$allowAlignedRectangle) {
            $labels->clone()
                ->where('use_aligned_rectangle', true)
                ->update(['shape' => null, 'use_aligned_rectangle' => false]);
        }

        if (!is_null($onlyShapes)) {
            $labels->clone()
                // If only_shapes is empty, this matches all labels with a shape.
                ->whereNotIn('shape', $onlyShapes)
                // Labels with the aligned rectangle tool don't depend on only_shapes.
                ->where('use_aligned_rectangle', false)
                ->update(['shape' => null]);
        }
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
        $this->authorize('update', $guideline);
        // Wrap in a transaction so DB::afterCommit() in the guideline model defers
        // storage deletion until the DB delete is committed.
        DB::transaction(fn () => $guideline->delete());
    }
}
