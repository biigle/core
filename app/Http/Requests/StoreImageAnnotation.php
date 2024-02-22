<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Biigle\Shape;

class StoreImageAnnotation extends StoreImageAnnotationLabel
{
    /**
     * The image on which the annotation should be created.
     *
     * @var Image
     */
    public $image;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->image = Image::findOrFail($this->route('id'));

        return $this->user()->can('add-annotation', $this->image);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return array_merge(parent::rules(), [
            'shape_id' => 'required|integer|exists:shapes,id',
            'points'   => 'required|array',
        ]);
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
            if ($this->input('shape_id') === Shape::wholeFrameId()) {
                $validator->errors()->add('shape_id', 'Image annotations cannot have shape WholeFrame.');
            }
        });
    }
}
