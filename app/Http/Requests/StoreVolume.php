<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;
use Biigle\Project;
use Biigle\Rules\VolumeUrl;
use Biigle\Rules\VolumeImages;
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
        return [
            'name' => 'required|max:512',
            'media_type_id' => 'required|exists:media_types,id',
            'url' => ['required', 'max:256', new VolumeUrl],
            'images' => ['required', 'array', new VolumeImages],
            'images.*' => ['max:512'],
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $images = $this->input('images');
        if (is_string($images)) {
            $this->merge([
                'images' => Volume::parseImagesQueryString($images),
            ]);
        }
    }
}
