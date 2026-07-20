<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\VideoAnnotationFrames;
use Biigle\Rules\VideoAnnotationPoints;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

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
        $validators = [
            'frames' => [
                'bail',
                'required',
                'array',
                new VideoAnnotationFrames($this->annotation->video->duration),
            ],
        ];

        if ($this->annotation->shape_id !== Shape::wholeFrameId()) {
            $validators['points'] = [
                'bail',
                'required',
                'array',
                new VideoAnnotationPoints,
            ];
        }

        return $validators;
    }
}
