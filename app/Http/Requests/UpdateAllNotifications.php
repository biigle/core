<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAllNotifications extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (is_null($this->input('user_id')) || !is_numeric($this->input('user_id'))) {
            // Skip authorization if the user id could not be found. The validation rules
            // will take care of rejecting this request with the proper response code.
            return true;
        }

        return $this->user()->id === $this->input('user_id');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|numeric'
        ];
    }
}
