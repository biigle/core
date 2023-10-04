<?php

namespace Biigle\Http\Requests;

use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\VideoAnnotationLabel;
use Biigle\VideoLabel;
use Illuminate\Foundation\Http\FormRequest;
use Validator;

class StoreLabelTreeMerge extends FormRequest
{
    /**
     * The label tree to create/remove the labels of.
     *
     * @var LabelTree
     */
    public $tree;

    /**
     * Flat array of labels to create.
     *
     * @var array
     */
    public $create;

    /**
     * Array of label IDs to remove.
     *
     * @var array
     */
    public $remove;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->tree = LabelTree::findOrFail($this->route('id'));
        $this->create = $this->getFlatLabels($this->input('create', []));
        $this->remove = array_unique($this->input('remove', []));

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
            'create' => 'required_without:remove|array',
            'remove' => 'required_without:create|array',
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
            $this->validateCreate($validator);
            $this->validateRemove($validator);
        });
    }

    /**
     * Validate the create labels.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     */
    protected function validateCreate($validator)
    {
        $parentIds = [];
        foreach ($this->create as $label) {
            if (array_key_exists('parent_id', $label) && array_key_exists('parent_index', $label)) {
                $validator->errors()->add('parent_id', 'New child labels must not have a parent ID.');
            }

            $v = Validator::make($label, [
                'name' => 'required|max:512',
                'color' => 'required|string|regex:/^\#?[A-Fa-f0-9]{6}$/',
                'parent_id' => 'integer',
                'children' => 'array',
            ]);

            if ($v->fails()) {
                $validator->errors()->merge($v->errors());
            } elseif (array_key_exists('parent_id', $label)) {
                $parentIds[] = $label['parent_id'];
            }
        }

        $parentIds = array_unique($parentIds);
        $count = $this->tree->labels()->whereIn('id', $parentIds)->count();
        if (count($parentIds) !== $count) {
            $validator->errors()->add('parent_id', 'All parent labels must belong to the label tree.');
        }

        if (count(array_intersect($parentIds, $this->remove)) > 0) {
            $validator->errors()->add('parent_id', 'A parent ID must not be among the labels to be removed.');
        }
    }

    /**
     * Validate the remove labels.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     */
    protected function validateRemove($validator)
    {
        // The remove IDs are already unique.
        $count = $this->tree->labels()->whereIn('id', $this->remove)->count();
        if (count($this->remove) !== $count) {
            $validator->errors()->add('remove', 'All labels to remove must belong to the label tree.');
        }

        $areUsed = Label::used()->whereIn('id', $this->remove)->exists();

        if ($areUsed) {
            $validator->errors()->add('remove', 'All labels to remove must not be used.');
        }

        $areParents = Label::whereNotIn('id', $this->remove)
            ->whereIn('parent_id', $this->remove)
            ->exists();

        if ($areParents) {
            $validator->errors()->add('remove', 'All labels to remove must not have children that should not be removed.');
        }
    }

    /**
     * Returns a flat list of a nested array of labels and assigns a parent_index to
     * each label, which indicates the position of the parent label in the list (as
     * opposed to a parent_id, sinde the labels have no ID yet).
     *
     * @param array $labels
     * @param array $carry
     * @param int $index
     *
     * @return array
     */
    protected function getFlatLabels($labels, &$carry = [], &$index = -1)
    {
        $parentIndex = $index;
        foreach ($labels as $label) {
            $index += 1;
            $children = [];
            if (array_key_exists('children', $label)) {
                $children = $label['children'];
                unset($label['children']);
            }

            // No not add a parent index for root labels.
            if ($parentIndex >= 0) {
                $label['parent_index'] = $parentIndex;
            }

            $carry[] = $label;
            $this->getFlatLabels($children, $carry, $index);
        }

        return $carry;
    }
}
