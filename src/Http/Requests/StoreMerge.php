<?php

namespace Biigle\Modules\LabelTrees\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class StoreMerge extends FormRequest
{
    /**
     * The label tree to create/remove the labels of.
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

        return $this->user()->can('create-label', $this->tree);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'create' => 'required|array',
            'remove' => 'required|array',
            'remove.*' => 'integer|exists:labels,id',
        ];
    }
}
