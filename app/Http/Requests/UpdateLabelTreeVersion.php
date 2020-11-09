<?php

namespace Biigle\Http\Requests;

use Biigle\LabelTreeVersion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'doi' => 'required|min:10',
        ];
    }
}
