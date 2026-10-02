<?php

namespace Biigle\Http\Requests;

use Biigle\AnnotationGuideline;
use Biigle\Http\Requests\Traits\ValidatesAnnotationGuideline;
use Biigle\Image;
use Biigle\Rules\AnnotationPoints;
use Biigle\Shape;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageAnnotation extends FormRequest
{
    use ValidatesAnnotationGuideline;

    /**
     * The image on which the annotation should be created.
     *
     * @var Image
     */
    public $image;

    /**
     * The enforced annotation guideline that applies to the new annotation.
     */
    public ?AnnotationGuideline $guideline = null;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->image = Image::findOrFail($this->route('id'));

        return $this->user()->can('add-annotation', $this->image);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id'    => 'required_without:feature_vector|integer|exists:labels,id',
            // A wildcard rule (feature_vector.*) is not used here because it would be
            // expanded to one rule per array element, which can consume excessive CPU
            // and memory if a huge array is submitted.
            'feature_vector' => [
                'bail',
                'required_without:label_id',
                'array',
                'size:384',
                function ($attribute, $value, $fail) {
                    if (array_filter($value, fn ($v) => !is_numeric($v))) {
                        $fail("The {$attribute} must contain only numbers.");
                    }
                },
            ],
            'confidence'  => 'required|numeric|between:0,1',
            'shape_id' => 'required|integer|exists:shapes,id',
            'points'   => [
                'bail',
                'required',
                'array',
                new AnnotationPoints($this->input('shape_id')),
            ],
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
            if (intval($this->input('shape_id')) === Shape::wholeFrameId()) {
                $validator->errors()->add('shape_id', 'Image annotations cannot have shape WholeFrame.');
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $this->guideline = $this->validateGuideline(
                $validator,
                $this->image->volume_id,
                $this->integer('guideline_id') ?: null
            );

            if (is_null($this->guideline)) {
                return;
            }

            $labelId = $this->integer('label_id') ?: null;
            if (!is_null($labelId)) {
                $this->validateGuidelineLabel($validator, $this->guideline, $labelId);
            }

            // Without label_id, this rejects shapes that are not allowed for any label.
            $this->validateGuidelineShape(
                $validator,
                $this->guideline,
                $this->integer('shape_id'),
                $labelId
            );
        });
    }
}
