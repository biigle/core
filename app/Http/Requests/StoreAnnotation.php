<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnotation extends StoreAnnotationLabel
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
            'shape_id' => 'required|id|exists:shapes,id',
            'points'   => 'required|array',
        ]);
    }
}
