<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\GreaterThan;
use Biigle\Rules\LessThan;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class SplitVideoAnnotation extends FormRequest
{
    /**
     * The annotation that should be split.
     *
     * @var VideoAnnotation
     */
    public $annotation;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotation = VideoAnnotation::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->annotation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $frames = $this->annotation->frames;
        $startFrame = $frames[0];
        $endFrame = end($frames);

        return [
            'time' => [
                'required',
                'numeric',
                new GreaterThan($startFrame),
                new LessThan($endFrame),
            ],
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
            $allowedShapes = [
                Shape::pointId(),
                Shape::rectangleId(),
                Shape::circleId(),
                Shape::wholeFrameId(),
            ];

            if (!in_array($this->annotation->shape_id, $allowedShapes)) {
                $validator->errors()->add('id', 'Only point, rectangle or circle annotations can be split.');
            }
        });
    }
}
