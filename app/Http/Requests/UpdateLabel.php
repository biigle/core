<?php

namespace Biigle\Http\Requests;

use Biigle\Label;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLabel extends FormRequest
{
    /**
     * The label to update.
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

        return $this->user()->can('update', $this->label);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'filled',
            'color' => 'filled|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
            'parent_id' => 'filled|integer|exists:labels,id',
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
        if ($validator->fails()) {
            return;
        }

        $validator->after(function ($validator) {
            if ($this->filled('parent_id')) {
                $sameTree = Label::where('id', $this->input('parent_id'))
                    ->where('label_tree_id', $this->label->label_tree_id)
                    ->exists();

                if (!$sameTree) {
                    $validator->errors()->add('parent_id', 'The parent label must belong to the same label tree as the updated label.');
                }
            }
        });
    }
}
