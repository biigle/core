<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;

class StoreLabelTree extends FormRequest
{
    /**
     * The project to which the new label tree should be attached (if any).
     *
     * @var Project|null
     */
    public $project;

    /**
     * The upstream label tree that should be forked (if any)
     *
     * @var LabelTree|null
     */
    public $upstreamLabelTree;

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
            'upstream_label_tree_id' => 'integer|exists:label_trees,id',
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
            if ($this->filled('project_id')) {
                $this->project = Project::find($this->input('project_id'));

                if (!$this->project || !$this->user()->can('update', $this->project)) {
                    $validator->errors()->add('project_id', 'You have no permission to create a label tree for this project.');
                }
            }

            if ($this->filled('upstream_label_tree_id')) {
                $this->upstreamLabelTree = LabelTree::find($this->input('upstream_label_tree_id'));

                if (!$this->upstreamLabelTree || !$this->user()->can('access', $this->upstreamLabelTree)) {
                    $validator->errors()->add('upstream_label_tree_id', 'You have no permission to fork this label tree.');
                }
            }
        });
    }
}
