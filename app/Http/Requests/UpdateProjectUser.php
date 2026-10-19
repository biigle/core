<?php

namespace Biigle\Http\Requests;

use Biigle\Enums\Role;
use Biigle\Project;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectUser extends FormRequest
{
    /**
     * The project to update the user in.
     *
     * @var Project
     */
    public $project;

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
        $this->project = Project::findOrFail($this->route('id'));
        $this->user = $this->project->users()->findOrFail($this->route('id2'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        if ($this->user->role === Role::GUEST) {
            $roles = [
                Role::GUEST,
                Role::EDITOR,
                Role::EXPERT
            ];
        } else {
            $roles = [
                Role::GUEST,
                Role::EDITOR,
                Role::EXPERT,
                Role::ADMIN
            ];
        }

        return [
            'project_role' => ['required', 'integer', Rule::in($roles)],
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
            if (!$this->project->userCanBeRemoved($this->user->id)) {
                $validator->errors()->add('id', "The last admin of {$this->project->name} cannot be removed. The admin status must be passed on to another user first.");
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
        if ($this->user->role === Role::GUEST) {
            return [
                'project_role.in' => 'Guest users may not become project admins.',
            ];
        }

        return [];
    }
}
