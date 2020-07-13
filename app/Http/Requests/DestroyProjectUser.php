<?php

namespace Biigle\Http\Requests;

use Biigle\Project;
use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;

class DestroyProjectUser extends FormRequest
{
    /**
     * The project to detach the user from.
     *
     * @var Project
     */
    public $project;

    /**
     * The user to detach.
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

        return $this->user()->can('remove-member', [$this->project, $this->user]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            //
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
}
