<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabelTreeVersion extends FormRequest
{
    /**
     * The label tree from which a new version should be created.
     *
     * @var LabelTree
     */
    public $tree;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->tree = LabelTree::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->tree);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => [
                'required',
                'max:256',
                Rule::unique('label_tree_versions')->where(function ($query) {
                    return $query->where('label_tree_id', $this->tree->id);
                }),
            ],
            'doi' => 'nullable|min:10',
        ];
    }
}
