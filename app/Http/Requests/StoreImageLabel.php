<?php

namespace Biigle\Http\Requests;

use Biigle\Image;
use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageLabel extends FormRequest
{
    /**
     * The image to which the label should be attached.
     *
     * @var Image
     */
    public $image;

    /**
     * The label that should be attached to the image.
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
        $this->image = Image::findOrFail($this->route('id'));
        $this->label = Label::find($this->input('label_id'));

        if (is_null($this->label)) {
            // Skip authorization if the label could not be found. The validation rules
            // will take care of rejecting this request with the proper response code.
            return true;
        }

        return $this->user()->can('attach-label', [$this->image, $this->label]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id'    => 'required|exists:labels,id',
        ];
    }
}
