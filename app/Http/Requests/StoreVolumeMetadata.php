<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\ImageMetadata;
use Biigle\Traits\ParsesImageMetadata;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class StoreVolumeMetadata extends FormRequest
{
    use ParsesImageMetadata;

    /**
     * The volume to store the new metadata to.
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
        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $files = $this->volume->images()->pluck('filename')->toArray();

        return [
            'file' => 'required|file|mimetypes:text/plain,text/csv',
            'metadata' => [
                new ImageMetadata($files),
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        if ($this->volume->isImageVolume() && $this->hasFile('file')) {
            $this->merge(['metadata' => $this->parseMetadataFile($this->file('file'))]);
        }
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
            if (!$this->volume->isImageVolume()) {
                $validator->errors()->add('file', 'Metadata can only be uploaded for image volumes.');
            }
        });
    }
}
