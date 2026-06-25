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
            'except' => 'required_without:only|array',
            'only' => 'required_without:except|array',
            'except.*' => 'integer|min:1',
            'only.*' => 'integer|min:1',
        ];
    }

    protected function prepareForValidation()
    {
        if ($this->filled('except')) {
            $this->merge(['except' => array_map('intval', explode(',', $this->input('except')))]);
        }

        if ($this->filled('only')) {
            $this->merge(['only' => array_map('intval', explode(',', $this->input('only')))]);
        }
    }
}
