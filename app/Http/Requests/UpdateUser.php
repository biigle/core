<?php

namespace Biigle\Http\Requests;

use Biigle\Enums\Role;
use Biigle\Rules\Utf8;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $roles = [
            Role::GUEST,
            Role::EDITOR,
            Role::ADMIN,
        ];

        return [
            // Ignore the email of the own user.
            'email' => "filled|email|unique:users,email,{$this->updateUser->id}|max:255",
            'password' => 'nullable|min:8',
            'firstname' => ['filled', 'max:127', new Utf8],
            'lastname' => ['filled', 'max:127', new Utf8],
            'role' => ['filled', 'integer', Rule::in($roles)],
            'auth_password' => 'required_with:role,password,email|current_password',
            'affiliation' => ['nullable', 'max:255', new Utf8],
            'super_user_mode' => 'filled|bool',
            'can_review' => 'filled|bool',
            'rate_limit' => 'filled|bool',
        ];
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
