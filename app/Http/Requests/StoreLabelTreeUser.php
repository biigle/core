<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\Role;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreLabelTreeUser extends FormRequest
{
    /**
     * The label tree to attach a user to.
     *
     * @var LabelTree
     */
    public $tree;

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

        return $this->user()->can('add-member', $this->tree);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->isGlobalGuest = User::where('id', $this->input('id'))
            ->where('role_id', Role::guestId())
            ->exists();

        if ($this->isGlobalGuest) {
            $roles = Role::editorId();
        } else {
            $roles = implode(',', [Role::adminId(), Role::editorId()]);
        }

        return [
            'id' => 'required|integer|exists:users,id',
            'role_id' => "required|integer|in:{$roles}",
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
            if ($this->tree->members()->where('id', $this->input('id'))->exists()) {
                $validator->errors()->add('id', 'The user is already member of this label tree.');
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
