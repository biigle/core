<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\Rules\Handle;
use Biigle\Rules\VolumeUrl;
use Biigle\Volume;
use \Illuminate\Foundation\Http\FormRequest;

class CloneVolume extends FormRequest
{
    /**
     * The volume to clone.
     *
     * @var Volume
     */
    public $volume;

    /**
     * The project to update.
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
        $this->project = Project::findOrFail($this->route('id2'));
        $this->volume = Volume::findOrFail($this->route('id'));

        $canUpdateProject = $this->user()->can('update', $this->project);
        $canCloneVolume = $this->user()->can('copy',$this->volume);

        //TODO: include $canCloneVolume
        return $canUpdateProject;
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
            'file_ids' => 'array',
            'file_ids.*' => 'int|gte:0',
            'label_ids' => 'array',
            'label_ids.*' => 'int|gte:0',
            'file_label_ids' => 'array',
            'file_label_ids.*' => 'int|gte:0'
            ];
    }

//    /**
//     * Prepare the data for validation.
//     *
//     * @return void
//     */
//    protected function prepareForValidation()
//    {
//        UpdateVolume::prepareForValidation();
//    }


}
