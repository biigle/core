<?php

namespace Biigle\Http\Requests;

use Biigle\Role;
use Biigle\User;
use Hash;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUser extends FormRequest
{
    /**
     * The user to update.
     *
     * @var User
     */
    public $updateUser;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->updateUser = User::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->updateUser) && $this->user()->can('sudo');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $roles = implode(',', [
            Role::guestId(),
            Role::editorId(),
            Role::adminId(),
        ]);

        return [
            // Ignore the email of the own user.
            'email' => "filled|email|unique:users,email,{$this->updateUser->id}|max:255",
            'password' => 'nullable|min:8',
            'firstname' => 'filled|max:127',
            'lastname' => 'filled|max:127',
            'role_id' => "filled|integer|in:{$roles}",
            'auth_password' => 'required_with:role_id,password,email',
            'affiliation' => 'nullable|max:255',
            'super_user_mode' => 'filled|bool',
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
            if ($this->filled('auth_password') && !Hash::check($this->input('auth_password'), $this->user()->password)) {
                $validator->errors()->add('auth_password', trans('validation.custom.password'));
            }
        });
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        if ($this->filled('email')) {
            $this->merge(['email' => strtolower($this->input('email'))]);
        }
    }
}
