<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;

class DestroyLabelTree extends FormRequest
{
    /**
     * The label tree to destroy.
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

        if (!$this->tree->canBeDeleted()) {
            throw new AuthorizationException('A label tree can only be deleted if none of its labels are in use.');
        }

        return $this->user()->can('destroy', $this->tree);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            //
        ];
    }
}
