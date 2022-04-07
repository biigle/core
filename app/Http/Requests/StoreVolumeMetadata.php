<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Traits\ParsesMetadata;
use Biigle\Volume;
use Exception;
use Illuminate\Foundation\Http\FormRequest;

class StoreVolumeMetadata extends FormRequest
{
    use ParsesMetadata;

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
        return [
            'metadata_csv' => 'required_without_all:metadata_text,ifdo_file|file|mimetypes:text/plain,text/csv,application/csv',
            'metadata_text' => 'required_without_all:metadata_csv,ifdo_file',
            'ifdo_file' => 'required_without_all:metadata_csv,metadata_text|file',
            'metadata' => 'filled',
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

        if ($this->hasFile('metadata_csv')) {
            $this->merge(['metadata' => $this->parseMetadataFile($this->file('metadata_csv'))]);
        } elseif ($this->input('metadata_text')) {
            $this->merge(['metadata' => $this->parseMetadata($this->input('metadata_text'))]);
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
        if ($validator->fails()) {
            return;
        }

        $validator->after(function ($validator) {
            if ($this->has('metadata')) {
                $files = $this->volume->files()->pluck('filename')->toArray();

                if ($this->volume->isImageVolume()) {
                    $rule = new ImageMetadata($files);
                } else {
                    $rule = new VideoMetadata($files);
                }

                if (!$rule->passes('metadata', $this->input('metadata'))) {
                    $validator->errors()->add('metadata', $rule->message());
                }
            }

            if ($this->hasFile('ifdo_file')) {
                try {
                    // This throws an error if the iFDO is invalid.
                    $data = $this->parseIfdoFile($this->file('ifdo_file'));

                    if ($data['media_type'] !== $this->volume->mediaType->name) {
                        $validator->errors()->add('ifdo_file', 'The iFDO image-acquisition type does not match the media type of the volume.');
                    }
                } catch (Exception $e) {
                    $validator->errors()->add('ifdo_file', $e->getMessage());
                }
            }
        });
    }
}
