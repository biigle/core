<?php

namespace Biigle\Http\Requests;

use Biigle\SystemMessage;
use Illuminate\Foundation\Http\FormRequest;

class StoreSystemMessage extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->user()->can('create', SystemMessage::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'title' => 'required|max:255',
            'body' => 'required',
            'type_id' => 'integer|exists:system_message_types,id',
            'publish' => 'boolean',
        ];
    }
}
