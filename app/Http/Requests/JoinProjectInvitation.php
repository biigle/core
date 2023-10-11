<?php

namespace Biigle\Http\Requests;

use Biigle\ProjectInvitation;
use Illuminate\Foundation\Http\FormRequest;

class JoinProjectInvitation extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'token' => "required|uuid",
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
        $this->invitation = ProjectInvitation::findOrFail($this->route('id'));

        $validator->after(function ($validator) {
            $tokenMatches = ProjectInvitation::where('id', $this->route('id'))
                ->where('uuid', $this->input('token'))
                ->exists();

            if (!$tokenMatches) {
                $validator->errors()->add('token', 'The provided invitation token was invalid.');
            }
        });
    }
}
