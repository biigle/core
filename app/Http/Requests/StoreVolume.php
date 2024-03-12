<?php

namespace Biigle\Http\Requests;

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Rules\Handle;
use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeUrl;
use Biigle\Services\MetadataParsing\ParserFactory;
use Biigle\Volume;
use File;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class StoreVolume extends FormRequest
{
    /**
     * The project to attach the new volume to.
     *
     * @var Project
     */
    public $project;

    /**
     * Filled if an uploaded metadata text was stored in a file.
     *
     * @var string
     */
    protected $metadataPath;

    /**
     * Remove potential temporary files.
     */
    public function __destruct()
    {
        if (isset($this->metadataPath)) {
            unlink($this->metadataPath);
        }
    }

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
            'metadata_csv' => 'file|mimetypes:text/plain,text/csv,application/csv|max:500000',
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
            $rule = new VolumeFiles($this->input('url'), $this->input('media_type_id'));
            if (!$rule->passes('files', $files)) {
                $validator->errors()->add('files', $rule->message());
            }

            if ($file = $this->file('metadata_csv')) {
                $type = $this->input('media_type');
                $parser = ParserFactory::getParserForFile($file, $type);
                if (is_null($parser)) {
                    $validator->errors()->add('metadata', 'Unknown metadata file format for this media type.');
                    return;
                }

                $rule = match ($type) {
                    'video' => new VideoMetadata,
                    default => new ImageMetadata,
                };

                if (!$rule->passes('metadata', $parser->getMetadata())) {
                    $validator->errors()->add('metadata', $rule->message());
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

        if ($this->input('metadata_text') && !$this->file('metadata_csv')) {
            $this->metadataPath = tempnam(sys_get_temp_dir(), 'volume_metadata');
            File::put($this->metadataPath, $this->input('metadata_text'));
            $file = new UploadedFile($this->metadataPath, 'metadata.csv', 'text/csv', test: true);
            // Reset this so the new file will be picked up.
            unset($this->convertedFiles);
            $this->files->add(['metadata_csv' => $file]);
        }

        // Backwards compatibility.
        if ($this->has('doi') && !$this->has('handle')) {
            $this->merge(['handle' => $this->input('doi')]);
        }
    }
}
