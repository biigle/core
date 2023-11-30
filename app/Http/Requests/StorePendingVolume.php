<?php

namespace Biigle\Http\Requests;

use Biigle\MediaType;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePendingVolume extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'media_type' => ['required', Rule::in(array_keys(MediaType::INSTANCES))],
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
            $exists = $this->project->pendingVolumes()
                ->where('user_id', $this->user()->id)
                ->exists();
            if ($exists) {
                $validator->errors()->add('id', 'Only a single pending volume can be created at a time for each project and user.');
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
        // Allow a string as media_type to be more conventient.
        $type = $this->input('media_type');
        if (in_array($type, array_keys(MediaType::INSTANCES))) {
            $this->merge(['media_type_id' => MediaType::$type()->id]);
        }
    }
}
