<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\Rules\VolumeFiles;
use Biigle\Rules\VolumeUrl;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

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
        $filesRule = new VolumeFiles($this->input('url'), $this->input('media_type_id'));

        return [
            'name' => 'required|max:512',
            'media_type_id' => 'required|id|exists:media_types,id',
            'url' => ['required', 'max:256', new VolumeUrl],
            'files' => ['required', 'array', $filesRule],
            'files.*' => ['max:512'],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // This establishes backwards compatibility of the old 'images' attribute which
        // is now 'files'.
        if ($this->missing('files') && $this->has('images')) {
            $this->merge(['files' => $this->input('images')]);
        }

        $images = $this->input('files');
        if (is_string($images)) {
            $this->merge(['files' => Volume::parseFilesQueryString($images)]);
        }
    }
}
