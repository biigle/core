<?php

namespace Biigle\Modules\Sync\Http\Requests;

use Biigle\LabelTree;
use Illuminate\Foundation\Http\FormRequest;

class ShowPublicLabelTreeExport extends FormRequest
{
    /**
     * The label tree that should be exported.
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
        $this->tree = LabelTree::find($this->route('id'));

        return $this->user()->can('access', $this->tree);
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
