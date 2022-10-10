<?php

namespace Biigle\Http\Requests;

use Biigle\User;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DestroyUser extends FormRequest
{
    /**
     * The user to delete.
     *
     * @var User
     */
    public $destroyUser;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->destroyUser = User::findOrFail($this->route('id'));

        return $this->user()->can('destroy', $this->destroyUser);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'password' => 'required|min:8|current_password',
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
            try {
                $this->destroyUser->checkCanBeDeleted();
            } catch (HttpException $e) {
                $validator->errors()->add('password', $e->getMessage());
            }
        });
    }
}
