<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Shape;
use Biigle\Modules\Videos\Rules\LessThan;
use Biigle\Modules\Videos\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;
use Biigle\Modules\Videos\Rules\GreaterThan;

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
        return $this->user()->can('update', $this->annotation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->annotation = VideoAnnotation::findOrFail($this->route('id'));
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
            ];

            if (!in_array($this->annotation->shape_id, $allowedShapes)) {
                $validator->errors()->add('id', 'Only point, rectangle or circle annotations can be split.');
            }
        });
    }
}
