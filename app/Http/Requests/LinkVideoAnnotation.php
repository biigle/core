<?php

namespace Biigle\Http\Requests;

use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class LinkVideoAnnotation extends FormRequest
{
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
        });
    }
}
