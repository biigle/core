<?php

namespace Biigle\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Rules\AnnotationPoints;
use Biigle\Shape;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'shape' => ['required_without:points', 'integer', Rule::enum(Shape::class)],
            'points' => 'required_without:shape|array',
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

            if ($this->getShape() === Shape::WHOLE_FRAME) {
                $validator->errors()->add('shape', 'Image annotations cannot have shape WholeFrame.');

                return;
            }

            // Attributes that are not updated must be validated with the current values
            // of the annotation, too, because e.g. a new shape may be invalid for the
            // existing points.
            $rule = new AnnotationPoints($this->getShape()->value);

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
     * Get the new shape of the annotation.
     */
    public function getShape(): Shape
    {
        if (!$this->has('shape')) {
            return $this->annotation->shape;
        }

        return Shape::from(intval($this->input('shape')));
    }
}
