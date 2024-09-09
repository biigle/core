<?php

namespace Biigle\Http\Requests;

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Services\MetadataParsing\ParserFactory;
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

        $rules = [
            'media_type' => ['required', Rule::in(array_keys(MediaType::INSTANCES))],
            'metadata_parser' => [
                'required_with:metadata_file',
            ],
            // Allow a maximum of 500 MB.
            'metadata_file' => [
                'required_with:metadata_parser',
                'file',
                'max:500000',
            ],
        ];

        $parserClass = $this->input('metadata_parser', false);
        if ($this->has('media_type') && $parserClass && ParserFactory::has($this->input('media_type'), $parserClass)) {
            $rules['metadata_file'][] = 'mimetypes:'.implode(',', $parserClass::getKnownMimeTypes());
        }

        return $rules;
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
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $exists = $this->project->pendingVolumes()
                ->where('user_id', $this->user()->id)
                ->exists();
            if ($exists) {
                $validator->errors()->add('id', 'Only a single pending volume can be created at a time for each project and user.');
                return;
            }

            if ($file = $this->file('metadata_file')) {
                $type = $this->input('media_type');
                $parserClass = $this->input('metadata_parser');

                if (!ParserFactory::has($type, $parserClass)) {
                    $validator->errors()->add('metadata_parser', 'Unknown metadata parser for this media type.');
                    return;
                }

                $parser = new $parserClass($file);
                if (!$parser->recognizesFile()) {
                    $validator->errors()->add('metadata_file', 'Unknown metadata file format.');
                    return;
                }

                $rule = match ($type) {
                    'video' => new VideoMetadata,
                    default => new ImageMetadata,
                };

                if (!$rule->passes('metadata_file', $parser->getMetadata())) {
                    $validator->errors()->add('metadata_file', $rule->message());
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
        $type = $this->input('media_type');
        if (in_array($type, array_keys(MediaType::INSTANCES))) {
            $this->merge(['media_type_id' => MediaType::$type()->id]);
        }
    }
}
