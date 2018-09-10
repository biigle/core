<?php

namespace Biigle\Http\Requests;

use Hash;
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
    public $user;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {

        return $this->user()->can('destroy', $this->user);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->user = $this->getDestroyUser();

        return [
            'password' => 'required|min:8',
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
            if ($this->has('password') && !Hash::check($this->input('password'), $this->user()->password)) {
                $validator->errors()->add('password', trans('validation.custom.password'));
            }

            try {
                $this->user->checkCanBeDeleted();
            } catch (HttpException $e) {
                $validator->errors()->add('password', $e->getMessage());
            }
        });
    }

    /**
     * Get the user instance to update;
     *
     * @return user
     */
    protected function getDestroyUser()
    {
        return User::findOrFail($this->route('id'));
    }
}
