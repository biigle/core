<?php

namespace Biigle\Http\Requests;

use Biigle\SystemMessage;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSystemMessage extends FormRequest
{
    /**
     * The system message to update.
     *
     * @var SystemMessage
     */
    public $message;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->message = SystemMessage::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->message);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'title' => 'filled',
            'body' => 'filled',
            'type_id' => 'filled|integer|exists:system_message_types,id',
            'publish' => 'filled|boolean',
        ];
    }
}
