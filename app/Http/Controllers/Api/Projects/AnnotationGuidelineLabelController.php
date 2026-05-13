<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreAnnotationGuidelineLabel;
use Biigle\Label;
use Biigle\Project;
use Biigle\Shape;
use Illuminate\Http\Request;
use Storage;

class AnnotationGuidelineLabelController extends Controller
{
    /**
     * Update the label within an annotation guideline.
     * @api {post} projects/:id/annotation-guideline-label Update the guideline for labels within an annotation guideline
     * @apiGroup Projects
     * @apiName UpdateAnnotationGuidelineLabel
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id THe ID of the project for the annotation guideline for the labels
     * @apiParam {Integer} label The ID for the label for the annotation guideline
     * @apiParam {Integer} shape (optional) The ID for the preferred shape for the label in the annotation guideline
     * @apiParam {String} description (optional) A description of the label
     * @apiParam {File} reference_image (optional) The reference image for the label
     *
     */
    public function update(StoreAnnotationGuidelineLabel $request)
    {

        $projectId = $request->project->id;
        $annotationGuideline = AnnotationGuideline::where(['project' => $projectId])->firstOrFail();
        $validated = $request->validated();

        $labelId = $validated['label'];
        $label = Label::findOrFail($labelId);

        $shapeId = $validated['shape'] ?? null;
        if (!is_null($shapeId)) {
            $shapeId = Shape::findOrFail($shapeId)->id;
        }

        $description = $validated['description'] ?? null;
        $referenceImage = $validated['reference_image'] ?? null;

        $disk = Storage::disk(config('projects.annotation_guideline_storage_disk'));

        $hasReferenceImage = !is_null($referenceImage);
        if ($hasReferenceImage) {
            $disk->putFileAs("$projectId", $referenceImage, "$label->id.jpg");
        }

        //If image already exists, avoid problems
        $imageExists = $disk->exists("$projectId/$label->id.jpg");
        AnnotationGuidelineLabel::updateOrCreate(
            [
                'annotation_guideline' => $annotationGuideline->id,
                'label' => $label->id,
            ],
            [
                'shape' => $shapeId,
                'description' => $description,
                'reference_image' => $imageExists,
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
        $annotationGuidelineLabel = $annotationGuideline->labels()
            ->where('label', $label->id)
            ->firstOrFail();

        $this->authorize('update', $project);

        $annotationGuidelineLabel->delete();

        $disk = Storage::disk(config('projects.annotation_guideline_storage_disk'));
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
        $annotationGuideline = AnnotationGuideline::where(['project' => $project->id])->firstOrFail();
        $annotationGuidelineLabel = $annotationGuideline->labels()
            ->where('label', $label->id)
            ->firstOrFail();

        $this->authorize('update', $project);

        $annotationGuidelineLabel->update(['reference_image' => false]);

        $disk = Storage::disk(config('projects.annotation_guideline_storage_disk'));
        $url = "$project->id/$label->id.jpg";
        if ($disk->exists($url)) {
            $disk->delete($url);
        }
    }
}
