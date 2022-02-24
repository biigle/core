<?php

namespace Biigle\Http\Requests;

use Biigle\Traits\ParsesMetadata;
use Exception;
use Illuminate\Foundation\Http\FormRequest;

class StoreParseIfdo extends FormRequest
{
    use ParsesMetadata;

    /**
     * The parsed metadata.
     *
     * @var array
     */
    public $metadata;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
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
            'file' => 'required|file',
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
            if ($this->hasFile('file')) {
                try {
                    $this->metadata = $this->parseIfdoFile($this->file('file'));
                } catch (Exception $e) {
                    $validator->errors()->add('file', $e->getMessage());
                }
            }
        });
    }
}
