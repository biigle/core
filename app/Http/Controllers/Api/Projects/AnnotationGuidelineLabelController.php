<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreAnnotationGuidelineLabel;
use Biigle\Label;
use DB;
use Storage;
use Str;

class AnnotationGuidelineLabelController extends Controller
{
    /**
     * Store or update a label entry in an annotation guideline.
     *
     * @api {post} annotation-guidelines/:id/labels Store or update a label in an annotation guideline
     * @apiGroup Projects
     * @apiName StoreAnnotationGuidelineLabel
     * @apiPermission projectAdmin
     *
     * @apiParam {Integer} id The ID of the annotation guideline
     * @apiParam {Integer} label_id The ID of the label
     * @apiParam {Integer} shape_id (optional) The ID of the preferred shape for the label
     * @apiParam {String} description (optional) A description of the label
     * @apiParam {File|null} reference_image (optional) The reference image for the label. Set to null to delete the previous reference image.
     */
    public function store(StoreAnnotationGuidelineLabel $request)
    {
        return DB::transaction(function () use ($request) {
            $guidelineId = $request->guideline->id;
            $validated = $request->validated();

            $labelId = $validated['label_id'];
            $shapeId = $validated['shape_id'] ?? null;
            $description = $validated['description'] ?? null;

            $label = $request->guideline->labels()
                ->where('label_id', $labelId)
                ->first();

            if ($label) {
                $guidelineLabel = $label->pivot;
                $guidelineLabel->update([
                    'shape_id' => $shapeId,
                    'description' => $description,
                ]);
            } else {
                $guidelineLabel = AnnotationGuidelineLabel::create([
                    'annotation_guideline_id' => $guidelineId,
                    'label_id' => $labelId,
                    'shape_id' => $shapeId,
                    'description' => $description,
                    'uuid' => Str::uuid(),
                ]);
            }

            $disk = Storage::disk(config('projects.annotation_guideline_storage_disk'));

            if (array_key_exists('reference_image', $validated)) {
                $image = $validated['reference_image'];
                if ($image) {
                    $disk->putFileAs($guidelineId, $image, $guidelineLabel->uuid);
                } elseif ($disk->exists("{$guidelineId}/{$guidelineLabel->uuid}")) {
                    $disk->delete("{$guidelineId}/{$guidelineLabel->uuid}");
                }
            }

            return $guidelineLabel;
        });
    }

    /**
     * Delete a label from an annotation guideline.
     *
     * @api {delete} annotation-guidelines/:id/labels/:label Delete a label from an annotation guideline
     * @apiGroup Projects
     * @apiName DestroyAnnotationGuidelineLabel
     * @apiPermission projectAdmin
     */
    public function destroy(int $guidelineId, int $labelId)
    {
        $guideline = AnnotationGuideline::findOrFail($guidelineId);
        $this->authorize('update', $guideline);

        $label = $guideline->labels()
            ->where('label_id', $labelId)
            ->firstOrFail();

        $label->pivot->delete();
    }
}
