<?php

namespace Biigle\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Rules\AnnotationPoints;
use Biigle\Shape;
use Illuminate\Foundation\Http\FormRequest;

class UpdateImageAnnotation extends FormRequest
{
    /**
     * The annotation that should be updated.
     *
     * @var ImageAnnotation
     */
    public $annotation;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotation = ImageAnnotation::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->annotation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'shape_id' => 'required_without:points|integer|exists:shapes,id',
            'points' => 'required_without:shape_id|array',
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
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            if ($this->getShapeId() === Shape::wholeFrameId()) {
                $validator->errors()->add('shape_id', 'Image annotations cannot have shape WholeFrame.');

                return;
            }

            // Attributes that are not updated must be validated with the current values
            // of the annotation, too, because e.g. a new shape may be invalid for the
            // existing points.
            $rule = new AnnotationPoints($this->getShapeId());

            $rule->validate(
                'points',
                $this->getPoints(),
                fn ($message) => $validator->errors()->add('points', $message)
            );
        });
    }

    /**
     * Get the new points of the annotation.
     */
    public function getPoints(): array
    {
        return $this->input('points', $this->annotation->points);
    }

    /**
     * Get the new shape ID of the annotation.
     */
    public function getShapeId(): int
    {
        return intval($this->input('shape_id', $this->annotation->shape_id));
    }
}
