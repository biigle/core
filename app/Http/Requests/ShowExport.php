<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShowExport extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'except' => 'sometimes|prohibits:only|array',
            'only' => 'sometimes|prohibits:except|array|min:1',
            'except.*' => 'integer|min:1',
            'only.*' => 'integer|min:1',
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
            if (!$this->exists('except') && !$this->exists('only')) {
                $validator->errors()->add('only', 'The only field is required when except is not present.');
            }
        });
    }

    protected function prepareForValidation()
    {
        if ($this->filled('except') && !is_array($this->input('except'))) {
            $this->merge(['except' => array_map('intval', explode(',', $this->input('except')))]);
        }

        if ($this->filled('only') && !is_array($this->input('only'))) {
            $this->merge(['only' => array_map('intval', explode(',', $this->input('only')))]);
        }
    }
}
