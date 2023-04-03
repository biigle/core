<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
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
        $this->volume = Volume::findOrFail($this->route('id'));
        $this->project = Project::findOrFail($this->route('id2'));

        return $this->user()->can('update', $this->project) &&
            $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'max:512',
            'only_files.*' => 'int|gt:0',
            'only_files' => 'array',
            'clone_annotations' => 'bool',
            'only_annotation_labels.*' => 'int|gt:0',
            'only_annotation_labels' => 'array',
            'clone_file_labels' => 'bool',
            'only_file_labels.*' => 'int|gt:0',
            'only_file_labels' => 'array'
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator)
    {
        if ($validator->fails()) {
            return;
        }

        $validator->after(function ($validator) {
            $fileIds = $this->input('only_files', []);
            if (!empty($fileIds)) {
                $intersection = array_intersect($fileIds, $this->volume->files()->pluck('id')->toArray());
                if (count($intersection) !== count($fileIds)) {
                    $validator->errors()->add('only_files',
                        'Cloning volume failed. Unauthorized access to files that do not belong to the volume');
                }
            }
        });
    }


}
