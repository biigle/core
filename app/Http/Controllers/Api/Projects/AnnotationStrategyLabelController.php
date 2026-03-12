<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Label;
use Biigle\Project;
use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Storage;

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
        $this->authorize('editIn', $project);
        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
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
        $this->authorize('update', $project);

        $labels = $request->labels;
        $shapes = $request->shapes;
        $descriptions = $request->descriptions;
        $referenceImages = $request->reference_images;

        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
        $aslToDelete = $annotationStrategy->strategyLabels()->whereNotIn('label_id', $labels);
        $aslToDelete->delete();

        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        foreach ($aslToDelete as $asl) {
            $url = "$project->id/$asl->reference_image";
            if ($disk->exists($url)) {
                $disk->delete($url);
            }
        }

        for ($i = 0; $i < count($labels); $i++) {
            AnnotationStrategyLabel::updateOrCreate(
                [
                    'annotation_strategy_id' => $annotationStrategy->id,
                    'label_id' => $labels[$i],
                ],
                [
                    'shape_id' => $shapes[$i],
                    'description' => $descriptions[$i],
                    'reference_image' => $referenceImages[$i],
                ]
            )->toSql();
        }
    }

    public function storeReferenceImage(Request $request)
    {
        //TODO: validate request?
        //TODO: should we send it to a temporary dir?
        //TODO: should we resize the image?
        $project = Project::findOrFail($request->id);
        $this->authorize('update', $project);
        $request->validate([
            'file' => 'required|file|mimes:jpg,png,pdf|max:5120',
        ]);

        $file = $request->file('file');
        $name = $file->hashName();
        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        $disk->putFileAs("$project->id/", $file, $name);
        return ['filename' => $name];
    }

    public function deleteReferenceImage(Request $request)
    {
        //TODO: validate request?
        //TODO: should we send it to a temporary dir?
        //TODO: should we resize the image?
        $project = Project::findOrFail($request->id);
        $name = $request->input('reference_image');

        $this->authorize('update', $project);

        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        $url = "$project->id/$name";
        if ($disk->exists($url)) {
            $disk->delete($url);
        }
    }
}
