<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Biigle\VideoAnnotationLabel;

class DestroyVideoAnnotationLabel extends FormRequest
{
    /**
     * The annotation label that should be deleted
     *
     * @var VideoAnnotationLabel
     */
    public $annotationLabel;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotationLabel = VideoAnnotationLabel::findOrFail($this->route('id'));

        return $this->user()->can('destroy', $this->annotationLabel);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            //
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
            $isOnlyLabel = !VideoAnnotationLabel::where('video_annotation_id', $this->annotationLabel->video_annotation_id)
                ->where('id', '!=', $this->annotationLabel->id)
                ->exists();

            if ($isOnlyLabel) {
                $validator->errors()->add('id', 'The last label of a video annotation cannot be detached. Delete the video annotation instead.');
            }
        });
    }
}
