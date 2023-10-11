<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Visibility;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectLabelTree extends FormRequest
{
    /**
     * The project to attach the label tree to.
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
            'id' => 'required|integer|exists:label_trees,id',
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

        $validator->after(function ($validator) {
            $tree = LabelTree::find($this->input('id'));
            if ($tree) {
                $public = $tree->visibility_id === Visibility::publicId();
                $authorized = $tree->authorizedProjects()->where('id', $this->project->id);

                if (!$public && !$authorized->exists()) {
                    $validator->errors()->add('id', 'The project is not allowed to use this label tree.');
                }
            }
        });
    }
}
