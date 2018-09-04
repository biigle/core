<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;

class DestroyLabelTreeUser extends FormRequest
{
    /**
     * The label tree to attach a user to.
     *
     * @var LabelTree
     */
    public $tree;

    /**
     * The label tree member to update.
     *
     * @var \Biigle\User
     */
    public $member;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->tree = LabelTree::findOrFail($this->route('id'));
        $this->member = $this->tree->members()->findOrFail($this->route('id2'));

        // Global admins can remove the last label tree admin so they can convert
        // ordinary label trees to global ones.
        if (!$this->user()->can('sudo') && !$this->tree->memberCanBeRemoved($this->member)) {
            throw new AuthorizationException('The only admin cannot be removed from a label tree.');
        }

        return $this->user()->can('remove-member', [$this->tree, $this->member]);
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
