<?php

namespace Biigle\Http\Requests;

use Biigle\User;
use Biigle\Rules\Uuid4;
use Illuminate\Foundation\Http\FormRequest;

class StoreUser extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->user()->can('create', User::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'email' => 'required|string|email|unique:users|max:255',
            'password' => 'required|string|min:8',
            'firstname' => 'required|string|max:127',
            'lastname' => 'required|string|max:127',
            'role_id' => 'exists:roles,id',
            'uuid' => ['nullable', new Uuid4],
            'affiliation' => 'nullable|max:255',
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        $this->merge(['email' => strtolower($this->input('email'))]);
    }
}
