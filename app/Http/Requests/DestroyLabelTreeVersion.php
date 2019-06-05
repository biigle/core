<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTree;
use Biigle\LabelTreeVersion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;

class DestroyLabelTreeVersion extends FormRequest
{
    /**
     * The label tree version that should be deleted.
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

        $tree = LabelTree::where('version_id', $this->version->id)->firstOrFail();
        if (!$tree->canBeDeleted()) {
            throw new AuthorizationException('A label tree version cannot be deleted if it contains labels that are still used.');
        }

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
            //
        ];
    }
}
