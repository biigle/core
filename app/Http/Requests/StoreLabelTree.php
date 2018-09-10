<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class StoreLabelTree extends FormRequest
{
    /**
     * The project to which the new label tree should be attached (if any).
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
        return $this->user()->can('create', LabelTree::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|max:256',
            'visibility_id' => 'required|integer|exists:visibilities,id',
            'project_id' => 'integer|exists:projects,id',
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
            if ($this->filled('project_id')) {
                $this->project = Project::find($this->input('project_id'));

                if (!$this->project || !$this->user()->can('update', $this->project)) {
                    $validator->errors()->add('project_id', 'You have no permission to create a label tree for this project.');
                }
            }
        });
    }
}
