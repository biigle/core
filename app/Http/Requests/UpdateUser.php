<?php

namespace Biigle\Http\Requests;

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
            'auth_password' => 'required_with:role_id,password,email|current_password',
            'affiliation' => 'nullable|max:255',
            'super_user_mode' => 'filled|bool',
            'can_review' => 'filled|bool',
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
