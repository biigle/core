<?php

namespace Biigle\Http\Requests;

use Biigle\Label;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Http\FormRequest;

class DestroyLabel extends FormRequest
{
    /**
     * The label to destroy.
     *
     * @var Label
     */
    public $label;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->label = Label::findOrFail($this->route('id'));

        if (!$this->label->canBeDeleted()) {
            throw new AuthorizationException('A label can only be deleted if it has no children and is not in use.');
        }

        return $this->user()->can('destroy', $this->label);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            //
        ];
    }
}
