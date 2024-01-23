<?php

namespace Biigle\Http\Requests;

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Rules\Handle;
use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeUrl;
use Biigle\Traits\ParsesMetadata;
use Biigle\Volume;
use Exception;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVolume extends FormRequest
{
    use ParsesMetadata;

    /**
     * The project to attach the new volume to.
     *
     * @var Project
     */
    public $project;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|max:512',
            'media_type' => ['filled', Rule::in(array_keys(MediaType::INSTANCES))],
            'url' => ['required', 'string', 'max:256', new VolumeUrl],
            'files' => [
                'required',
                'array',
            ],
            'handle' => ['nullable', 'max:256', new Handle],
            'metadata_csv' => 'file|mimetypes:text/plain,text/csv,application/csv',
            'ifdo_file' => 'file',
            'metadata' => 'filled',
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
        if ($validator->fails()) {
            return;
        }

        // Only validate sample volume files after all other fields have been validated.
        $validator->after(function ($validator) {
            $files = $this->input('files');
            $rule = new VolumeFiles($this->input('url'), $this->input('media_type_id'));
            if (!$rule->passes('files', $files)) {
                $validator->errors()->add('files', $rule->message());
            }

            if ($this->has('metadata')) {
                if ($this->input('media_type_id') === MediaType::imageId()) {
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

                    if ($data['media_type'] !== $this->input('media_type')) {
                        $validator->errors()->add('ifdo_file', 'The iFDO image-acquisition type does not match the media type of the volume.');
                    }
                } catch (Exception $e) {
                    $validator->errors()->add('ifdo_file', $e->getMessage());
                }
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
        // Default is image to be backwards compatible with custom import scripts.
        $type = $this->input('media_type', 'image');
        if (in_array($type, array_keys(MediaType::INSTANCES))) {
            $this->merge(['media_type_id' => MediaType::$type()->id]);
        }

        // This establishes backwards compatibility of the old 'images' attribute which
        // is now 'files'.
        if ($this->missing('files') && $this->has('images')) {
            $this->merge(['files' => $this->input('images')]);
        }

        $files = $this->input('files');
        if (is_string($files)) {
            $this->merge(['files' => Volume::parseFilesQueryString($files)]);
        }

        if ($this->input('metadata_text')) {
            $this->merge(['metadata' => $this->parseMetadata($this->input('metadata_text'))]);
        } elseif ($this->hasFile('metadata_csv')) {
            $this->merge(['metadata' => $this->parseMetadataFile($this->file('metadata_csv'))]);
        }

        // Backwards compatibility.
        if ($this->has('doi') && !$this->has('handle')) {
            $this->merge(['handle' => $this->input('doi')]);
        }
    }
}
