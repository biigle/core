<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Enums\Shape;
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
     * @apiParam {Integer} shape (optional) The ID of the preferred shape for the label
     * @apiParam {Boolean} use_aligned_rectangle (optional) Only relevant if shape is a rectangle. If true, the aligned rectangle tool should be used for the label, otherwise (default) the regular rectangle tool. Always stored as false for other shapes.
     * @apiParam {String} description (optional) A description of the label
     * @apiParam {File|null} reference_image (optional) The reference image for the label (JPEG, max. 5 MB, max. 300x300 px). Set to null to delete the previous reference image.
     */
    public function store(StoreAnnotationGuidelineLabel $request)
    {
        return DB::transaction(function () use ($request) {
            $guidelineId = $request->guideline->id;
            $validated = $request->validated();

            $labelId = $validated['label_id'];
            // Multipart requests send the shape as string.
            $shape = $request->filled('shape') ? $request->integer('shape') : null;
            // The flag must only be set for rectangles so it is unambiguous.
            $useAlignedRectangle = $shape === Shape::RECTANGLE->value
                && ($validated['use_aligned_rectangle'] ?? false);
            $description = $validated['description'] ?? null;

            $label = $request->guideline->labels()
                ->where('label_id', $labelId)
                ->first();

            if ($label) {
                $guidelineLabel = $label->pivot;
                $guidelineLabel->update([
                    'shape' => $shape,
                    'use_aligned_rectangle' => $useAlignedRectangle,
                    'description' => $description,
                ]);
            } else {
                $guidelineLabel = AnnotationGuidelineLabel::create([
                    'annotation_guideline_id' => $guidelineId,
                    'label_id' => $labelId,
                    'shape' => $shape,
                    'use_aligned_rectangle' => $useAlignedRectangle,
                    'description' => $description,
                    'uuid' => Str::uuid(),
                ]);
            }

            if (array_key_exists('reference_image', $validated)) {
                $disk = Storage::disk(config('projects.annotation_guideline_disk'));
                $image = $validated['reference_image'];
                if ($image) {
                    $path = "{$guidelineId}/{$guidelineLabel->uuid}.jpg";
                    if ($disk->putFileAs("$guidelineId", $image, "{$guidelineLabel->uuid}.jpg") === false) {
                        abort(500, 'The reference image could not be stored.');
                    }
                    $guidelineLabel->update(['reference_image_path' => $path]);
                } elseif (!is_null($guidelineLabel->reference_image_path)) {
                    $path = $guidelineLabel->reference_image_path;
                    // Defer storage deletion until after the DB transaction commits to
                    // avoid deleting the file if the transaction rolls back.
                    DB::afterCommit(fn () => $disk->delete($path));
                    $guidelineLabel->update(['reference_image_path' => null]);
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

        // Wrap in a transaction so DB::afterCommit() in the guideline label model
        // defers storage deletion until the DB delete is committed.
        DB::transaction(fn () => $label->pivot->delete());
    }
}
