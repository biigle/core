<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\Project;
use Biigle\AnnotationStrategy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnotationStrategyController extends Controller
{
    /**
     * Get all image labels and annotation count for a given project
     *
     * @api {get} projects/:pid/strategy Get annotation labels with a annotation count
     * @apiGroup Projects
     * @apiName AnnotationStrategy
     * @apiParam {Number} id The Project ID
     * @apiPermission projectMember
     * @apiDescription Returns a collection of annotation labels and their counts in the project
     *
     * @apiSuccessExample {json} Success response:
     * [{"id":1,
     * "name":"a",
     * "color":"f2617c",
     * "label_tree_id":1,
     * "count":10}]
     *
     * @param int $id Project ID
     * @return \Illuminate\Support\Collection
     */
    public function index($id)
    {
        $project = Project::where(['project' => $id])->firstOrFail();
        $this->authorize('access', $project);
        return AnnotationStrategy::first('project', $id);
    }

    //TODO: form request for strategy
    /**
     * Update a label.
     *
     * @api {put} labels/:id Update a label
     * @apiGroup Labels
     * @apiName UpdateLabels
     * @apiPermission labelTreeEditor
     *
     * @apiParam {Number} id The label ID
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the label.
     * @apiParam (Attributes that can be updated) {String} color Color of the label as hexadecimal string (like `bada55`). May have an optional `#` prefix.
     * @apiParam (Attributes that can be updated) {Number} parent_id ID of the parent label for ordering in a tree-like structure.
     *
     * @param UpdateLabel $request
     */
    //public function update(UpdateAnnotationStrategy $request)
    public function update(Request $request)
    {
        AnnotationStrategy::updateOrCreate(
            ['project' => $request->id],
            ['description' =>  $request->description]
        );
    }

    /**
     * Delete a label.
     *
     * @api {delete} labels/:id Delete a label
     * @apiGroup Labels
     * @apiName DestroyLabels
     * @apiPermission labelTreeEditor
     * @apiDescription A label may only be deleted if it doesn't have child labels and is
     * not in use anywhere (e.g. attached to an annotation).
     *
     * @apiParam {Number} id The label ID
     *
     * @param DestroyLabel $request
     */
    //public function destroy(DestroyAnnotationStrategy $request)
    public function delete(Request $request)
    {
        $annotationStrategy = AnnotationStrategy::where(['project'=> $request->id])->firstOrFail();
        $annotationStrategy->delete();
    }

}
