<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\Role;
use Biigle\User;
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
     * Determines whether the user to be attached is a global guest.
     *
     * @var bool
     */
    protected $isGlobalGuest;

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
        $this->isGlobalGuest = User::where('id', $this->route('id2'))
            ->where('role', Role::GUEST)
            ->exists();

        if ($this->isGlobalGuest) {
            $roles = Role::EDITOR->value;
        } else {
            $roles = implode(',', [Role::ADMIN->value, Role::EDITOR->value]);
        }

        return [
            'role' => "integer|in:{$roles}",
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
            $shouldLooseAdminStatus = $this->integer('role') !== Role::ADMIN->value;
            if ($shouldLooseAdminStatus && !$this->tree->memberCanLooseAdminStatus($this->member)) {
                $validator->errors()->add('role', 'The last label tree admin cannot be demoted.');
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
        if ($this->isGlobalGuest) {
            return [
                'role.in' => 'Guest users may only be label tree editors.',
            ];
        }

        return [
            'role.in' => 'Label tree members may only be either admins or editors.',
        ];
    }
}
