<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\Handle;
use Biigle\Rules\VolumeFiles;
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
            'url' => ['bail', 'filled', 'string', 'max:256', new VolumeUrl],
            'handle' => ['bail', 'nullable', 'string', 'max:256', new Handle],
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
            // validated, and only when the URL is actually being updated.
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $newUrl = $this->input('url');
            if (is_null($newUrl) || $newUrl === $this->volume->url) {
                return;
            }

            $filenames = $this->volume->files()->pluck('filename')->all();
            if (empty($filenames)) {
                return;
            }

            $rule = new VolumeFiles($newUrl, $this->volume->media_type_id);
            if (!$rule->passes('url', $filenames)) {
                $validator->errors()->add('url', $rule->message());
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
