<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTreeVersion;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLabelTreeVersion extends FormRequest
{
    /**
     * The label tree version that should be updated.
     *
     * @var LabelTreeVersion
     */
    public $version;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->version = LabelTreeVersion::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->version);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => [
                'required',
                'max:256',
                Rule::unique('label_tree_versions')->where(function ($query) {
                    return $query->where('label_tree_id', $this->version->label_tree_id);
                }),
            ],
            'description' => 'nullable',
        ];
    }
}
