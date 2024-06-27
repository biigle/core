<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\Annotation;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class IndexVolumeAnnotationsSimilarity extends FormRequest
{
    /**
     * The volume of which to index the annotations.
     */
    public Volume $volume;

    /**
     * The reference annotation for sorting.
     */
    public $reference;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('access', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id' => 'required|bail|integer',
            'annotation_id' => 'required|bail|integer',
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
            if ($this->volume->isImageVolume()) {
                $this->reference = ImageAnnotationLabelFeatureVector::where('volume_id', $this->volume->id)
                    ->where('label_id', $this->input('label_id'))
                    ->where('annotation_id', $this->input('annotation_id'))
                    ->first();
            } else {
                $this->reference = VideoAnnotationLabelFeatureVector::where('volume_id', $this->volume->id)
                    ->where('label_id', $this->input('label_id'))
                    ->where('annotation_id', $this->input('annotation_id'))
                    ->first();
            }

            if (is_null($this->reference)) {
                $validator->errors()->add('annotation_id', 'The annotation does not exist in the volume.');
            }
        });
    }
}
