<?php

namespace Biigle\Http\Requests;

use Biigle\User;
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
            ->where('role_id', Role::guestId())
            ->exists();

        if ($this->isGlobalGuest) {
            $roles = Role::editorId();
        } else {
            $roles = implode(',', [Role::adminId(), Role::editorId()]);
        }

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
            $shouldLooseAdminStatus = $this->input('role_id') !== Role::adminId();
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
        if ($this->isGlobalGuest) {
            return [
                'role_id.in' => 'Guest users may only be label tree editors.',
            ];
        }

        return [
            'role_id.in' => 'Label tree members may only be either admins or editors.',
        ];
    }
}
