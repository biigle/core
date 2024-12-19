<?php

namespace Biigle\Http\Requests;

use Biigle\ImageAnnotation;
use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageAnnotationLabel extends FormRequest
{
    /**
     * The annotation to which the label should be attached.
     *
     * @var ImageAnnotation
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
        $this->annotation = ImageAnnotation::findOrFail($this->route('id'));
        $this->label = Label::findOrFail($this->input('label_id'));

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
            'label_id' => 'required|integer|exists:labels,id',
            'confidence'  => 'required|numeric|between:0,1',
        ];
    }
}
