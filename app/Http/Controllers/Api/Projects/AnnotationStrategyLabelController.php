<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Illuminate\Http\Request;
use Storage;

class AnnotationStrategyLabelController extends Controller
{
    /**
     * Update the strategy for labels within an annotation strategy. Deletes the strategies for labels that are not used anymore.
     *
     * @api {post} projects/:id/annotation-strategy-label Update the strategy for labels within an annotation strategy
     * @apiGroup Projects
     * @apiName UpdateAnnotationStrategyLabels
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id THe ID of the project for the annotation strategy for the labels
     * @apiParam {Array} labels The IDs for the labels for the annotation strategy
     * @apiParam {Array} shapes The IDs for the shapes for the annotation strategy
     * @apiParam {Array} descriptions The IDs for the shapes for the annotation strategy
     * @apiParam {Array} reference_images The name of the files of the reference images
     *
     */
    public function update(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $this->authorize('update', $project);

        $labels = $request->labels;
        $shapes = $request->shapes;
        $descriptions = $request->descriptions;
        $referenceImages = $request->reference_images;

        $annotationStrategy = AnnotationStrategy::where(['project' => $project->id])->firstOrFail();
        $aslToDelete = $annotationStrategy->strategyLabels()->whereNotIn('label', $labels);
        $aslToDelete->delete();

        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        foreach ($aslToDelete->get() as $asl) {
            $url = "$project->id/$asl->reference_image";
            if ($disk->exists($url)) {
                $disk->delete($url);
            }
        }

        for ($i = 0; $i < count($labels); $i++) {
            AnnotationStrategyLabel::updateOrCreate(
                [
                    'annotation_strategy' => $annotationStrategy->id,
                    'label' => $labels[$i],
                ],
                [
                    'shape' => $shapes[$i],
                    'description' => $descriptions[$i],
                    'reference_image' => $referenceImages[$i],
                ]
            );
        }
    }

    /**
     * Store a reference image. Returns the name with which the file is stored.
     *
     * @api {post} projects/:id/annotation-strategy-labels/upload-image Upload a reference image
     * @apiGroup Projects
     * @apiName StoreReferenceImage
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id The ID of the project for the annotation strategy for the labels
     * @apiParam {File} file The reference image to upload
     *
     * @apiSuccessExample {json} Success response:
     * {"filename": "nameOfTheFile"}
     */
    public function storeReferenceImage(Request $request)
    {
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

    /**
     * Delete a reference image.
     *
     * @api {delete} projects/:id/annotation-strategy-labels/delete-image Delete a reference image
     * @apiGroup Projects
     * @apiName DeleteReferenceImage
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id The ID of the project for the annotation strategy for the labels
     *
     */
    public function deleteReferenceImage(Request $request)
    {
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
