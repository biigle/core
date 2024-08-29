<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePinnedProject extends FormRequest
{
    /**
     * The project to pin.
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

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $pinnedCount = $this->user()->projects()->where('pinned', true)->count();

            if ($pinnedCount === 3 && !$this->project->getRelationValue('pivot')->pinned) {
                $validator->errors()->add('id', 'You cannot pin more than three projects.');
            }
        });
    }
}
