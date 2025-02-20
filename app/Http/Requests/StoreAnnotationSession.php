<?php

namespace Biigle\Http\Requests;

use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnotationSession extends FormRequest
{
    /**
     * The volume to store the annotation session to.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|max:256',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'users' => 'present|array',
            'users.*' => 'distinct|integer|exists:users,id',
            'hide_other_users_annotations' => 'filled|boolean',
            'hide_own_annotations' => 'filled|boolean',
        ];
    }
}
