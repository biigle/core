<?php

namespace Biigle\Http\Requests\Traits;

use Biigle\AnnotationGuideline;
use Biigle\Services\AnnotationGuidelineService;
use Illuminate\Validation\Validator;

trait ValidatesAnnotationGuideline
{
    /**
     * Get the enforced annotation guideline that was chosen for the volume and add a
     * validation error if the choice is invalid.
     */
    protected function validateGuideline(
        Validator $validator,
        int $volumeId,
        ?int $guidelineId,
        string $attribute = 'guideline_id'
    ): ?AnnotationGuideline {
        $service = app(AnnotationGuidelineService::class);
        $user = $this->user();

        if (is_null($guidelineId)) {
            if ($service->mustUseGuideline($user, $volumeId)) {
                $validator->errors()->add($attribute, 'An enforced annotation guideline must be chosen for this volume.');
            }

            return null;
        }

        $guideline = $service->getGuidelines($user, $volumeId)
            ->first(fn ($g) => $g->id === $guidelineId && $g->enforced && $g->can_annotate);

        if (is_null($guideline)) {
            $validator->errors()->add($attribute, 'The annotation guideline does not exist, is not enforced or cannot be used for this volume.');
        }

        return $guideline;
    }

    /**
     * Add a validation error if the label is not allowed by the guideline.
     */
    protected function validateGuidelineLabel(
        Validator $validator,
        AnnotationGuideline $guideline,
        int $labelId,
        string $attribute = 'label_id'
    ): void {
        if ($guideline->allowsLabel($labelId)) {
            return;
        }

        $validator->errors()->add($attribute, 'The label is not allowed by the annotation guideline.');
    }

    /**
     * Add a validation error if the shape is not allowed by the guideline (optionally in
     * combination with a label).
     */
    protected function validateGuidelineShape(
        Validator $validator,
        AnnotationGuideline $guideline,
        int $shapeId,
        ?int $labelId = null,
        string $attribute = 'shape_id'
    ): void {
        if ($guideline->allowsShape($shapeId, $labelId)) {
            return;
        }

        if (is_null($labelId)) {
            $validator->errors()->add($attribute, 'The shape is not allowed by the annotation guideline.');
        } else {
            $validator->errors()->add($attribute, 'The shape is not allowed for this label by the annotation guideline.');
        }
    }
}
