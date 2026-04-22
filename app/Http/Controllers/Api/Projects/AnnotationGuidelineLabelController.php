<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreAnnotationGuidelineLabel;
use Biigle\Label;
use Biigle\Project;
use Illuminate\Http\Request;
use Storage;

class AnnotationGuidelineLabelController extends Controller
{
    /**
     * Update the label within an annotation guideline.
     * @api {post} projects/:id/annotation-guideline-label Update the guideline for labels within an annotation guideline
     * @apiGroup Projects
     * @apiName UpdateAnnotationGuidelineLabels
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id THe ID of the project for the annotation guideline for the labels
     * @apiParam {Integer} label The ID for the label for the annotation guideline
     * @apiParam {Integer} shape The IDs for the shapes for the annotation guideline
     * @apiParam {String} description The IDs for the shapes for the annotation guideline
     * @apiParam {File} reference_image The reference image for the desired label
     *
     */
    public function update(StoreAnnotationGuidelineLabel $request)
    {

        $projectId = $request->project->id;
        $annotationGuideline = AnnotationGuideline::where(['project' => $projectId])->firstOrFail();
        $validated = $request->validated();

        $label = $validated['label'];
        $shape = $validated['shape'];
        $description = $validated['description'];
        $referenceImage = $validated['reference_image'];

        $disk = Storage::disk(config('annotation_guideline.storage_disk'));

        if ($referenceImage != null) {
            $disk->putFileAs("$projectId", $referenceImage, "$label.jpg");
        }
        AnnotationGuidelineLabel::updateOrCreate(
            [
                'annotation_guideline' => $annotationGuideline->id,
                'label' => $label,
            ],
            [
                'shape' => $shape,
                'description' => $description,
            ]
        );
    }

    /**
     * Delete a label from a guideline.
     *
     * @api {delete} projects/:id/annotation-guideline-labels/delete-image Delete a reference image
     * @apiGroup Projects
     * @apiName DeleteReferenceImage
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id The ID of the project for the annotation guideline for the labels
     *
     */
    public function delete(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $label = Label::findOrFail($request->label);
        $annotationGuideline = AnnotationGuideline::where(['project' => $project->id])->firstOrFail();
        $annotationGuidelineLabel = $annotationGuideline->guidelineLabels()->where(['label' => $label->id])->firstOrFail();

        $this->authorize('update', $project);

        $annotationGuidelineLabel->delete();

        $disk = Storage::disk(config('annotation_guideline.storage_disk'));
        $url = "$project->id/$label->id.jpg";
        if ($disk->exists($url)) {
            $disk->delete($url);
        }
    }

    /**
     * Delete a reference image.
     *
     * @api {delete} projects/:id/annotation-guideline-labels/delete-image Delete a reference image
     * @apiGroup Projects
     * @apiName DeleteReferenceImage
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id The ID of the project for the annotation guideline for the labels
     *
     */
    public function deleteReferenceImage(Request $request)
    {
        $project = Project::findOrFail($request->id);
        $label = Label::findOrFail($request->label);

        $this->authorize('update', $project);

        $disk = Storage::disk(config('annotation_guideline.storage_disk'));
        $url = "$project->id/$label->id.jpg";
        if ($disk->exists($url)) {
            $disk->delete($url);
        }
    }
}
