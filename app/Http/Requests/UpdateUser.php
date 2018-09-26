<?php

namespace Biigle\Http\Requests;

use Hash;
use Biigle\Role;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUser extends FormRequest
{
    /**
     * The user to update.
     *
     * @var User
     */
    public $user;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->user()->can('update', $this->user) && $this->user()->can('sudo');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->user = $this->getUpdateUser();
        $roles = implode(',', [
            Role::$guest->id,
            Role::$editor->id,
            Role::$admin->id,
        ]);

        return [
            // Ignore the email of the own user.
            'email' => "filled|email|unique:users,email,{$this->user->id}|max:255",
            'password' => 'nullable|min:8|confirmed',
            'firstname' => 'filled|max:127',
            'lastname' => 'filled|max:127',
            'role_id' => "filled|in:{$roles}",
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

    /**
     * Get the user instance to update;
     *
     * @return user
     */
    protected function getUpdateUser()
    {
        return User::findOrFail($this->route('id'));
    }
}
