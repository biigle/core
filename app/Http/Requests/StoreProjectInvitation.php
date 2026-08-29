<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\Role;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectInvitation extends FormRequest
{
    /**
     * The project to attach a user to.
     *
     * @var Project
     */
    public $project;

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
        $roles = implode(',', [
            Role::guestId(),
            Role::editorId(),
            Role::expertId(),
        ]);

        return [
            'expires_at' => "required|date|after:today",
            'role_id' => "in:{$roles}",
            'max_uses' => "integer|min:1",
            'add_to_sessions' => "boolean",
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
            if ($this->input('add_to_sessions') && intval($this->input('role_id')) === Role::guestId()) {
                $validator->errors()->add('add_to_sessions', 'Project guests cannot be added to annotation sessions. Use a different role.');
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
            'role_id.in' => 'Invited users may only become experts, editors or guests.',
        ];
    }
}
