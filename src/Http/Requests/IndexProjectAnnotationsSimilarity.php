<?php

namespace Biigle\Modules\Largo\Http\Requests;

use Biigle\Annotation;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\VideoAnnotation;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;

class IndexProjectAnnotationsSimilarity extends FormRequest
{
    /**
     * The project of which to index the annotations.
     */
    public Project $project;

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
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('access', $this->project);
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
            'image_annotation_id' => 'required_without:video_annotation_id|bail|integer',
            'video_annotation_id' => 'required_without:image_annotation_id|bail|integer',
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

            $ids = $this->project->volumes()->pluck('id');
            if ($this->input('image_annotation_id')) {
                $this->reference = ImageAnnotationLabelFeatureVector::whereIn('volume_id', $ids)
                    ->where('label_id', $this->input('label_id'))
                    ->where('annotation_id', $this->input('image_annotation_id'))
                    ->first();

                if (is_null($this->reference)) {
                    $validator->errors()->add('image_annotation_id', 'The annotation does not exist in the project.');
                }
            } else {
                $this->reference = VideoAnnotationLabelFeatureVector::whereIn('volume_id', $ids)
                    ->where('label_id', $this->input('label_id'))
                    ->where('annotation_id', $this->input('video_annotation_id'))
                    ->first();

                if (is_null($this->reference)) {
                    $validator->errors()->add('video_annotation_id', 'The annotation does not exist in the project.');
                }
            }

        });
    }
}
