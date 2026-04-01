<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreAnnotationStrategyLabel;
use Biigle\Label;
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
    public function update(StoreAnnotationStrategyLabel $request)
    {

        $projectId = $request->project->id;
        $annotationStrategy = AnnotationStrategy::where(['project' => $projectId])->firstOrFail();
        $validated = $request->validated();

        $labels = $validated['labels'];
        $shapes = $validated['shapes'];
        $descriptions = $validated['descriptions'];
        $referenceImages = $validated['reference_images'];

        if (
            count($labels) !== count($shapes) ||
            count($labels) !== count($descriptions) ||
            count($labels) !== count($referenceImages)
        ) {
            abort(422, 'Something wrong has happened.');
        }

        $aslToDelete = $annotationStrategy->strategyLabels()->whereNotIn('label', $labels);
        $aslToDeleteRecords = $aslToDelete->get();

        $aslToDelete->delete();

        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        foreach ($aslToDeleteRecords as $asl) {
            $url = $projectId.'/'.$asl->label.'.jpg';
            if ($disk->exists($url)) {
                $disk->delete($url);
            }
        }

        for ($i = 0; $i < count($labels); $i++) {
            $referenceImage = $referenceImages[$i];
            $label = $labels[$i];
            if ($referenceImage != null) {
                $disk->putFileAs("$projectId", $referenceImage, "$label.jpg");
            }
            AnnotationStrategyLabel::updateOrCreate(
                [
                    'annotation_strategy' => $annotationStrategy->id,
                    'label' => $label,
                ],
                [
                    'shape' => $shapes[$i],
                    'description' => $descriptions[$i],
                ]
            );
        }
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
        $label = Label::findOrFail($request->label);

        $this->authorize('update', $project);

        $disk = Storage::disk(config('annotation_strategy.storage_disk'));
        $url = "$project->id/$label->id.jpg";
        if ($disk->exists($url)) {
            $disk->delete($url);
        }
    }
}
