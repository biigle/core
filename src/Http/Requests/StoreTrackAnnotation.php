<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Shape;
use Biigle\Modules\Videos\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class StoreTrackAnnotation extends FormRequest
{
    /**
     * The annotation that should be tracked.
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
            if (count($this->annotation->frames) !== 1) {
                $validator->errors()->add('id', 'Only single frame annotations can be tracked.');
            }

            if ($this->annotation->shape_id !== Shape::pointId()) {
                $validator->errors()->add('id', 'Only point annotations can be tracked.');
            }
        });
    }
}
