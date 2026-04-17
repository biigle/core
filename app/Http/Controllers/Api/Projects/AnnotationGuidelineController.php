<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Illuminate\Http\Request;
use Storage;

class AnnotationGuidelineController extends Controller
{
    /**
     * Get the annotation guideline for the given project and the associated labels
     *
     * @api {get} projects/:pid/annotation-guideline Get the annotation guideline for the given project
     * @apiGroup Projects
     * @apiName AnnotationGuideline
     * @apiParam {Number} id The Project ID
     * @apiPermission projectAdmin
     * @apiDescription Returns the annotation guideline and the associated labels
     *
     * @apiSuccessExample {json} Success response:
     * {"annotation_guideline":[{
     *    "id":1,
     *    "project":2,
     *    "description":"guideline description"
     *  }],
     *  "annotation_guideline_labels" : [{
     *      "annotation_guideline": 1,
     *      "label":4,
     *      "shape":7,
     *      "description":"description of a label",
     *      "label":
     *        {
     *          "id":4,
     *          "name":"something else",
     *        },
     *  }]}
     *
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $guideline = AnnotationGuideline::where(['project'=> $id])
            ->firstOrFail();
        $guidelineLabels = $guideline
            ->guidelineLabels()
            ->select()
            ->with('label')
            ->get();
        return ['annotation_guideline' => $guideline, 'annotation_guideline_labels' => $guidelineLabels];

    }

    /**
     * Update the annotation guideline for the given project
     *
     * @api {post} projects/:pid/annotation-guideline Update the annotation guideline for the given project
     * @apiGroup Projects
     * @apiName AnnotationGuideline
     * @apiParam {Number} id The Project ID
     * @apiParam {String} description A description on how to annotate the guideline
     * @apiPermission projectAdmin
     * @apiDescription Edit the annotation guideline associated with the given ID
     *
     * @param int $id Project ID
     */
    public function update(Request $request, int $id)
    {
        $request->validate([
            'description' => 'required|string|min:1',
        ]);

        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        AnnotationGuideline::updateOrCreate(
            ['project' => $project->id],
            ['description' =>  $request->description]
        );

    }

    /**
     * Delete the annotation guideline for the given project
     *
     * @api {delete} projects/:pid/annotation-guideline Delete the annotation guideline for the given project
     * @apiGroup Projects
     * @apiName AnnotationGuideline
     * @apiParam {Number} id The Project ID
     * @apiPermission projectAdmin
     * @apiDescription Delete the annotation guideline associated with the given ID
     */
    public function delete(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $this->authorize('update', $project);
        $annotationGuideline = AnnotationGuideline::where(['project'=> $project->id])->firstOrFail();
        $annotationGuideline->delete();

        //Cleanup the directory
        $disk = Storage::disk(config('annotation_guideline.storage_disk'));
        $url = "$project->id/";
        if ($disk->exists($url)) {
            $disk->deleteDirectory($url);
        }
    }
}
