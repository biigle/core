<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\VolumeUrl;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVolume extends FormRequest
{
    /**
     * The volume to update.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'filled|max:512',
            'url' => ['filled', new VolumeUrl],
            'handle' => 'max:256',
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

        // Only validate sample volume files after all other fields have been validated.
        $validator->after(function ($validator) {
            $handle = $this->input('handle');
            if (!empty($handle) && substr_count($handle, '/') !== 1) {
                $validator->errors()->add('handle', 'Please provide a valid handle or DOI.');
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
        // Backwards compatibility.
        if ($this->has('doi') && !$this->has('handle')) {
            $this->merge(['handle' => $this->input('doi')]);
        }
    }
}
