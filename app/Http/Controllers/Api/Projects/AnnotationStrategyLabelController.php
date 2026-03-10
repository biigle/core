<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\Project;
use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnnotationStrategyLabelController extends Controller {
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
    public function index(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $this->authorize('access', $project);
        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
        //TODO: add method for annotationStrategyLabels that returns the names rather than the ids of shape, labels etc
        return $annotationStrategy->strategyLabels()->get();
    }

    //TODO: form request for strategy
    /**
     * Upload the reference image for a label.
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
        $project = Project::findOrFail($request->id);
        $this->authorize('access', $project);

        $labels = $request->labels;
        $shapes = $request->shapes;
        $descriptions = $request->descriptions;

        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
        $annotationStrategy->strategyLabels()->whereNotIn('label_id', $labels)->delete();

        for ($i = 0; $i < count($labels); $i++) {
            AnnotationStrategyLabel::updateOrCreate(
                [
                    'annotation_strategy_id' => $annotationStrategy->id,
                    'label_id' => $labels[$i],
                ],
                [
                    'shape_id' => $shapes[$i],
                    'description' => $descriptions[$i],
                ]
            );
        }
    }

    public function storeReferenceImage(Request $request)
    {
        //TODO: validate request using
        $project = Project::findOrFail($request->id);
        $this->authorize('access', $project);
        $request->validate([
            'file' => 'required|file|mimes:jpg,png,pdf|max:5120',
        ]);

        $file = $request->file;
        $shapes = $request->shapes;
        $descriptions = $request->descriptions;

        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
        $annotationStrategy->strategyLabels()->whereNotIn('label_id', $labels)->delete();

        for ($i = 0; $i < count($labels); $i++) {
            AnnotationStrategyLabel::updateOrCreate(
                [
                    'annotation_strategy_id' => $annotationStrategy->id,
                    'label_id' => $labels[$i],
                ],
                [
                    'shape_id' => $shapes[$i],
                    'description' => $descriptions[$i],
                ]
            );
        }
    }
}
