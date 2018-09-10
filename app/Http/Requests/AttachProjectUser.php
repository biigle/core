<?php

namespace Biigle\Http\Requests;

use Biigle\User;
use Biigle\Role;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;

class AttachProjectUser extends FormRequest
{
    /**
     * The project to attach a user to.
     *
     * @var Project
     */
    public $project;

    /**
     * The user to attach.
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
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->user = User::findOrFail($this->route('id2'));

        if ($this->user->role_id === Role::$guest->id) {
            $roles = [
                Role::$guest->id,
                Role::$editor->id,
                Role::$expert->id
            ];
        } else {
            $roles = [
                Role::$guest->id,
                Role::$editor->id,
                Role::$expert->id,
                Role::$admin->id
            ];
        }

        $roles = implode(',', $roles);

        return [
            'project_role_id' => "required|in:{$roles}",
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
            if ($this->project->users()->where('id', $this->route('id2'))->exists()) {
                $validator->errors()->add('id', 'The user is already member of this project.');
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
        if ($this->user->role_id === Role::$guest->id) {
            return [
                'project_role_id.in' => 'Guest users may not become project admins.',
            ];
        }

        return [];
    }
}
