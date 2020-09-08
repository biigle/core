<?php

namespace Biigle\Http\Requests;

use Biigle\FederatedSearchInstance;
use Illuminate\Foundation\Http\FormRequest;

class StoreFederatedSearchInstance extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->user()->can('create', FederatedSearchInstance::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|min:1|max:512',
            'url' => 'required|url|unique:federated_search_instances,url',
        ];
    }
}
