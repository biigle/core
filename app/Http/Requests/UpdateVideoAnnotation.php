<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\VideoAnnotationFrames;
use Biigle\Rules\VideoAnnotationGaps;
use Biigle\Rules\VideoAnnotationPoints;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVideoAnnotation extends FormRequest
{
    /**
     * The annotation that should be updated
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
        return [
            'frames' => [
                'bail',
                'required',
                'array',
                new VideoAnnotationFrames($this->annotation->video->duration),
            ],
            'points' => [
                'bail',
                Rule::when(!$this->isWholeFrame(), 'required'),
                'array',
                new VideoAnnotationPoints($this->annotation->shape_id),
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
            if ($validator->messages()->isNotEmpty()) {
                // Skip additional validation rules if the regular rules above failed.
                return;
            }

            // Whole frame annotations have no points, so there are no gaps to check.
            if (!$this->isWholeFrame()) {
                $gapsRule = new VideoAnnotationGaps($this->input('frames', []));
                $gapsRule->validate(
                    'points',
                    $this->input('points', []),
                    fn ($message) => $validator->errors()->add('points', $message)
                );
            }
        });
    }

    /**
     * Determine if the annotation is a whole frame annotation.
     */
    protected function isWholeFrame(): bool
    {
        return $this->annotation->shape_id === Shape::wholeFrameId();
    }
}
