<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
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
     *       "annotation_guideline_id": 1,
     *       "label_id": 4,
     *       "shape_id": 7,
     *       "description": "description of a label",
     *       "reference_image_path": null
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
     * @apiPermission projectAdmin
     */
    public function store(Request $request, int $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        if ($project->annotationGuideline()->exists()) {
            throw ValidationException::withMessages([
                'id' => 'The project already has an annotation guideline.',
            ]);
        }

        $request->validate([
            'description' => 'nullable|string|min:1',
        ]);

        return AnnotationGuideline::create([
            'project_id' => $project->id,
            'description' => $request->description,
        ]);
    }

    /**
     * Update the annotation guideline.
     *
     * @api {put} annotation-guidelines/:id Update the annotation guideline
     * @apiGroup Projects
     * @apiName UpdateAnnotationGuideline
     * @apiParam {Number} id The guideline ID
     * @apiParam {String} [description] Description of how to annotate.
     * @apiPermission projectAdmin
     */
    public function update(Request $request, int $id)
    {
        $guideline = AnnotationGuideline::findOrFail($id);
        $this->authorize('update', $guideline->project);

        $request->validate([
            'description' => 'nullable|string|min:1',
        ]);

        $guideline->update(['description' => $request->description]);
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
        $guideline->delete();
    }
}
