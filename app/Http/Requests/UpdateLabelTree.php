<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLabelTree extends FormRequest
{
    /**
     * The label tree to update.
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
            'name' => 'filled|max:256',
            'visibility_id' => 'integer|exists:visibilities,id',
        ];
    }
}
