<?php

namespace Biigle\Http\Requests;

use Biigle\Http\Requests\Traits\ValidatesAnnotationGuideline;
use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

abstract class StoreVolumeFileLabel extends FormRequest
{
    use ValidatesAnnotationGuideline;

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
        $this->validate(['label_id' => 'required|integer|exists:labels,id']);
        $this->label = Label::find($this->input('label_id'));

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
            // The label_id is already validated above.
            'guideline_id' => 'nullable|integer',
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

            $guideline = $this->validateGuideline(
                $validator,
                $this->file->volume_id,
                $this->integer('guideline_id') ?: null
            );

            if (is_null($guideline)) {
                return;
            }

            // File labels have no shape, so only the label is checked.
            $this->validateGuidelineLabel($validator, $guideline, $this->label->id);
        });
    }

    /**
     * Get the file model class;
     *
     * @return string
     */
    abstract protected function getFileModel();
}
