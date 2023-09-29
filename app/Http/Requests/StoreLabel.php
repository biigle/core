<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class StoreLabel extends FormRequest
{
    /**
     * The label tree to which the label should be attached.
     *
     * @var LabelTree
     */
    public $tree;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->tree = LabelTree::findOrFail($this->route('id'));

        return $this->user()->can('create-label', $this->tree);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|max:512',
            'color' => 'required|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
            'parent_id' => 'integer|exists:labels,id',
            'label_source_id' => 'integer|exists:label_sources,id',
            'source_id' => 'required_with:label_source_id',
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
                $sameTree = $this->tree
                    ->labels()
                    ->where('id', $this->input('parent_id'))
                    ->exists();

                if (!$sameTree) {
                    $validator->errors()->add('parent_id', 'The parent label must belong to the same label tree as the new label.');
                }
            }
        });
    }
}
