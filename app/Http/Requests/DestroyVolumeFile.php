<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class DestroyVolumeFile extends FormRequest
{
    /**
     * The file that should be deleted.
     *
     * @var \Biigle\VolumeFile
     */
    public $file;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $model = $this->getFileModel();
        $this->file = $model::findOrFail($this->route('id'));

        return $this->user()->can('destroy', $this->file);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'force' => 'filled|boolean',
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
            if ($this->file->annotations()->exists() && !$this->input('force')) {
                $validator->errors()->add('id', "Deleting the file would delete annotations. Use the 'force' argument to delete anyway.");
            }
        });
    }

    /**
     * Get the file model class name.
     *
     * @return string
     */
    abstract protected function getFileModel();
}
