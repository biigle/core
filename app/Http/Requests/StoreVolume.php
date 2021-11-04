<?php

namespace Biigle\Http\Requests;

use Biigle\MediaType;
use Biigle\Project;
use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeUrl;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;
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
            'url' => ['required', 'max:256', new VolumeUrl],
            'files' => [
                'required',
                'array',
                new VolumeFiles($this->input('url'), $this->input('media_type_id')),
            ],
            // Do not validate the maximum filename length with a 'files.*' rule because
            // this leads to a request timeout when the rule is expanded for a huge
            // number of files.
        ];
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
    }
}
