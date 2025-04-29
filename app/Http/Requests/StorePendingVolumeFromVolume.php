<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class StorePendingVolumeFromVolume extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'import_annotations' => 'bool|required_without:import_file_labels',
            'import_file_labels' => 'bool|required_without:import_annotations',
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
            if (!$this->input('import_annotations') && !$this->input('import_file_labels')) {
                $validator->errors()->add('id', 'Either import_annotations or import_file_labels must be set to true.');
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $metadata = $this->volume->getMetadata();

            if (is_null($metadata)) {
                $validator->errors()->add('id', 'The volume has no metadata file.');
                return;
            }

            if ($this->input('import_annotations') && !$metadata->hasAnnotations()) {
                $validator->errors()->add('import_annotations', 'The volume metadata has no annotation information.');
            }

            if ($this->input('import_file_labels') && !$metadata->hasFileLabels()) {
                $validator->errors()->add('import_file_labels', 'The volume metadata has no file label information.');
            }

        });
    }
}
