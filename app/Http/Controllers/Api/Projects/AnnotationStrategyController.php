<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationStrategy;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Illuminate\Http\Request;
use Storage;

class AnnotationStrategyController extends Controller
{
    /**
     * Get the annotation strategy for the given project and the associated labels
     *
     * @api {get} projects/:pid/annotation-strategy Get the annotation strategy for the given project
     * @apiGroup Projects
     * @apiName AnnotationStrategy
     * @apiParam {Number} id The Project ID
     * @apiPermission projectEditor
     * @apiDescription Returns the annotation strategy and the associated labels
     *
     * @apiSuccessExample {json} Success response:
     * [{"annotation_strategy":{
     *  {
     *    "id":1,
     *    "project":2,
     *    "description":"strategy description"
     *  },
     *  "annotation_strategy_labels" : {
     *    {
     *      "annotation_strategy": 1,
     *      "label":4,
     *      "shape":7,
     *      "description":"description of a label",
     *      "reference_image":"file.jpg",
     *      "label":
     *        {
     *          "id":4,
     *          "name":"something else",
     *        },
     *  }}]
     *
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);
        $strategy = AnnotationStrategy::where(['project'=> $id])
            ->firstOrFail();
        $strategyLabels = $strategy
            ->strategyLabels()
            ->select()
            ->with('label')
            ->get();
        return ['annotation_strategy' => $strategy, 'annotation_strategy_labels' => $strategyLabels];

    }

    /**
     * Update the annotation strategy for the given project
     *
     * @api {post} projects/:pid/annotation-strategy Update the annotation strategy for the given project
     * @apiGroup Projects
     * @apiName AnnotationStrategy
     * @apiParam {Number} id The Project ID
     * @apiParam {String} description A description on how to annotate the strategy
     * @apiPermission projectAdmin
     * @apiDescription Edit the annotation strategy associated with the given ID
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

        AnnotationStrategy::updateOrCreate(
            ['project' => $project->id],
            ['description' =>  $request->description]
        );
    }

    /**
     * Delete the annotation strategy for the given project
     *
     * @api {delete} projects/:pid/annotation-strategy Delete the annotation strategy for the given project
     * @apiGroup Projects
     * @apiName AnnotationStrategy
     * @apiParam {Number} id The Project ID
     * @apiPermission projectAdmin
     * @apiDescription Delete the annotation strategy associated with the given ID
     */
    public function delete(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $this->authorize('update', $project);
        $annotationStrategy = AnnotationStrategy::where(['project'=> $project->id])->firstOrFail();
        $annotationStrategy->delete();

        //Cleanup the directory
        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        $url = "$project->id/";
        if ($disk->exists($url)) {
            $disk->deleteDirectory($url);
        }
    }
}
