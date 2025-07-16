<?php

namespace Biigle\Http\Requests;

use Biigle\Label;
use Biigle\VideoAnnotation;
use Illuminate\Foundation\Http\FormRequest;

class StoreVideoAnnotationLabel extends FormRequest
{
    /**
     * The annotation to which the label should be attached.
     *
     * @var VideoAnnotation
     */
    public $annotation;

    /**
     * The label that should be attached.
     *
     * @var Label
     */
    public $label;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotation = VideoAnnotation::findOrFail($this->route('id'));

        $this->validate(['label_id' => 'required|integer|exists:labels,id']);
        $this->label = Label::find($this->input('label_id'));

        return $this->user()->can('attach-label', [$this->annotation, $this->label]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            // The label_id is already validated above.
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
        if ($validator->fails()) {
            return;
        }

        $validator->after(function ($validator) {
            $alreadyExists = $this->annotation->labels()
                ->where('label_id', $this->label->id)
                ->where('user_id', $this->user()->id)
                ->exists();

            if ($alreadyExists) {
                $validator->errors()->add('label_id', 'The user already attached this label to the annotation.');
            }
        });
    }
}
