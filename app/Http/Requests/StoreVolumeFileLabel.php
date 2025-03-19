<?php

namespace Biigle\Http\Requests;

use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

abstract class StoreVolumeFileLabel extends FormRequest
{
    /**
     * The file to which the label should be attached.
     *
     * @var \Biigle\VolumeFile
     */
    public $file;

    /**
     * The label that should be attached to the file.
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
        $model = $this->getFileModel();
        $this->file = $model::findOrFail($this->route('id'));
        $this->validate(['label_id' => 'integer']);
        $this->label = Label::find($this->input('label_id'));
        
        if (is_null($this->label)) {
            // Skip authorization if the label could not be found. The validation rules
            // will take care of rejecting this request with the proper response code.
            return true;
        }

        return $this->user()->can('attach-label', [$this->file, $this->label]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'label_id'    => 'required|integer|exists:labels,id',
        ];
    }

    /**
     * Get the file model class;
     *
     * @return string
     */
    abstract protected function getFileModel();
}
