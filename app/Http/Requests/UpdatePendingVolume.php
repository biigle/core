<?php

namespace Biigle\Http\Requests;

use Biigle\PendingVolume;
use Biigle\Rules\Handle;
use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeUrl;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePendingVolume extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $this->pendingVolume = PendingVolume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->pendingVolume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|max:512',
            'url' => ['required', 'string', 'max:256', new VolumeUrl],
            'files' => ['required', 'array', 'min:1'],
            'handle' => ['nullable', 'max:256', new Handle],
            'import_annotations' => 'bool',
            'import_file_labels' => 'bool',
            // Do not validate the maximum filename length with a 'files.*' rule because
            // this leads to a request timeout when the rule is expanded for a huge
            // number of files. This is checked in the VolumeFiles rule below.
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
            // Only validate sample volume files after all other fields have been
            // validated.
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $files = $this->input('files');
            $rule = new VolumeFiles($this->input('url'), $this->pendingVolume->media_type_id);
            if (!$rule->passes('files', $files)) {
                $validator->errors()->add('files', $rule->message());
            }
        });
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $files = $this->input('files');
        if (!is_array($files)) {
            $files = explode(',', $files);
        }

        $files = array_map(fn ($f) => trim($f, " \n\r\t\v\x00'\""), $files);
        $this->merge(['files' => array_filter($files)]);
    }
}
