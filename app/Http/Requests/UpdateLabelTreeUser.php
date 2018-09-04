<?php

namespace Biigle\Http\Requests;

use Biigle\Role;
use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLabelTreeUser extends FormRequest
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

        return $this->user()->can('update-member', [$this->tree, $this->member]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $roles = implode(',', [Role::$admin->id, Role::$editor->id]);

        return [
            'role_id' => "integer|in:{$roles}",
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
            $shouldLooseAdminStatus = $this->input('role_id') !== Role::$admin->id;
            if ($shouldLooseAdminStatus && !$this->tree->memberCanLooseAdminStatus($this->member)) {
                $validator->errors()->add('role_id', 'The last label tree admin cannot be demoted.');
            }
        });
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'role_id.in' => 'Label tree members may only be either admins or editors.',
        ];
    }
}
