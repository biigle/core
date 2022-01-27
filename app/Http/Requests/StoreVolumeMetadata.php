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
            'metadata_csv' => 'required_without:metadata_text|file|mimetypes:text/plain,text/csv,application/csv',
            'metadata_text' => 'required_without:metadata_csv',
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

        // Backwards compatibility.
        if ($this->hasFile('file') && !$this->hasFile('metadata_csv')) {
            $this->convertedFiles['metadata_csv'] = $this->file('file');
        }

        if ($this->volume->isImageVolume()) {
            if ($this->hasFile('metadata_csv')) {
                $this->merge(['metadata' => $this->parseMetadataFile($this->file('metadata_csv'))]);
            } elseif ($this->input('metadata_text')) {
                $this->merge(['metadata' => $this->parseMetadata($this->input('metadata_text'))]);
            }
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
                if ($this->hasFile('metadata_csv')) {
                    $validator->errors()->add('metadata_csv', 'Metadata can only be uploaded for image volumes.');
                } else {
                    $validator->errors()->add('metadata_text', 'Metadata can only be uploaded for image volumes.');
                }
            }
        });
    }
}
