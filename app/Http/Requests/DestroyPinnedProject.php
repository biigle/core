<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DestroyPinnedProject extends FormRequest
{
    /**
     * The project to unpin.
     *
     * @var \Biigle\Project
     */
    public $project;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = $this->user()->projects()->findOrFail($this->route('id'));

        return true;
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
