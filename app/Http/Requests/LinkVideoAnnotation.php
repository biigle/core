<?php

namespace Biigle\Http\Requests;

use Biigle\Http\Requests\Traits\ValidatesAnnotationGuideline;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Illuminate\Foundation\Http\FormRequest;

class LinkVideoAnnotation extends FormRequest
{
    use ValidatesAnnotationGuideline;

    /**
     * The first annotation that should be linked.
     *
     * @var VideoAnnotation
     */
    public $firstAnnotation;

    /**
     * The second annotation that should be linked.
     *
     * @var VideoAnnotation
     */
    public $secondAnnotation;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->firstAnnotation = VideoAnnotation::findOrFail($this->route('id'));
        $this->secondAnnotation = VideoAnnotation::findOrFail($this->input('annotation_id'));

        return $this->user()->can('update', $this->firstAnnotation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'annotation_id' => 'required|integer|exists:video_annotations,id',
            'guideline_id' => 'nullable|integer',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->firstAnnotation->video_id !== $this->secondAnnotation->video_id) {
                $validator->errors()->add('annotation_id', 'The two annotations must belong to the same video.');
            }

            $frames = $this->firstAnnotation->frames;
            $firstStarts = $frames[0];
            $firstEnds = end($frames);
            $frames = $this->secondAnnotation->frames;
            $secondStarts = $frames[0];
            $secondEnds = end($frames);

            if ($firstStarts > $secondStarts && $firstStarts < $secondEnds
                || $firstEnds > $secondStarts && $firstEnds < $secondEnds
                || $secondStarts > $firstStarts && $secondStarts < $firstEnds
                || $secondEnds > $firstStarts && $secondEnds < $firstEnds
                || $firstStarts === $secondStarts && $firstEnds === $secondEnds) {
                $validator->errors()->add('annotation_id', 'The two annotations must not overlap.');
            }

            if ($this->firstAnnotation->shape_id !== $this->secondAnnotation->shape_id) {
                $validator->errors()->add('annotation_id', 'The two annotations must have the same shape.');
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $guideline = $this->validateGuideline(
                $validator,
                $this->firstAnnotation->video->volume_id,
                $this->integer('guideline_id') ?: null
            );

            if (is_null($guideline)) {
                return;
            }

            // The linked annotation gets all labels of both annotations.
            $labelIds = VideoAnnotationLabel::whereIn('annotation_id', [
                    $this->firstAnnotation->id,
                    $this->secondAnnotation->id,
                ])
                ->distinct()
                ->pluck('label_id');

            foreach ($labelIds as $labelId) {
                $this->validateGuidelineLabel($validator, $guideline, $labelId, 'annotation_id');
                $this->validateGuidelineShape(
                    $validator,
                    $guideline,
                    $this->firstAnnotation->shape_id,
                    $labelId,
                    'annotation_id'
                );
            }
        });
    }
}
